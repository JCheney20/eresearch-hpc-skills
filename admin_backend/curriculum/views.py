import json

from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from .layout import generate_layout
from .models import AuditRecord, Challenge, ChallengeDraft, CurriculumDraft, Topic
from .publication import publish
from .rendering import render_blocks
from .validation import validate_blocks, validate_graph


def error_response(error, status=400):
    messages = error.messages if isinstance(error, ValidationError) else [str(error)]
    return JsonResponse({"ok": False, "errors": messages}, status=status)


def draft_data(challenge):
    try:
        draft = challenge.draft
    except ChallengeDraft.DoesNotExist:
        return None
    return {
        "version": draft.version,
        "kind": draft.kind,
        "title": draft.title,
        "author": draft.author,
        "source": draft.source,
        "minimumReadSeconds": draft.minimum_read_seconds,
        "content": draft.content,
        "world": draft.world,
    }


@staff_member_required
@require_GET
def editor(request):
    curriculum = CurriculumDraft.objects.order_by("-updated_at").first()
    graph = curriculum.graph if curriculum else {"nodes": [], "connections": [], "layouts": {}}
    bootstrap = {
        "author": request.user.get_full_name() or request.user.get_username(),
        "urls": {
            "challenge": "/admin/curriculum-editor/challenge/",
            "graph": "/admin/curriculum-editor/graph/",
            "layout": "/admin/curriculum-editor/layout/",
            "preview": "/admin/curriculum-editor/preview/",
            "publish": "/admin/curriculum-editor/publish/",
        },
        "curriculum": {"id": curriculum.pk if curriculum else None, "version": curriculum.version if curriculum else 0, "graph": graph},
        "topics": list(Topic.objects.filter(archived=False).values("key", "name")),
        "challenges": [
            {"number": challenge.number, "slug": challenge.slug, "draft": draft_data(challenge)}
            for challenge in Challenge.objects.filter(archived=False)
        ],
    }
    return render(request, "curriculum/editor.html", {"bootstrap": bootstrap})


@staff_member_required
@require_POST
def save_challenge(request):
    try:
        data = json.loads(request.body)
        challenge = Challenge.objects.get(number=data["number"], archived=False)
        with transaction.atomic():
            current = ChallengeDraft.objects.select_for_update().filter(challenge=challenge).first()
            expected = int(data.get("version", 0))
            if current and current.version != expected:
                return error_response(ValidationError("This draft changed after you opened it. Reload before saving."), 409)
            if not current and expected != 0:
                return error_response(ValidationError("This draft no longer exists. Reload before saving."), 409)
            if current and current.kind == "code" and current.content.get("legacyManifest"):
                return error_response(ValidationError("Existing code challenges remain developer-owned until the declarative validator is implemented."), 409)
            draft = current or ChallengeDraft(challenge=challenge, version=0)
            draft.kind = data["kind"]
            draft.title = data["title"]
            draft.author = data["author"]
            draft.source = data.get("source", {})
            draft.minimum_read_seconds = 120
            draft.content = data["content"]
            draft.world = data.get("world", {})
            draft.version = expected + 1
            draft.updated_by = request.user
            draft.full_clean()
            draft.save()
            AuditRecord.objects.create(
                actor=request.user,
                action="save-draft",
                object_type="ChallengeDraft",
                object_id=challenge.number,
                changes={"fromVersion": expected, "toVersion": draft.version},
            )
        return JsonResponse({"ok": True, "version": draft.version})
    except (KeyError, ValueError, json.JSONDecodeError, Challenge.DoesNotExist, ValidationError) as error:
        return error_response(error)


@staff_member_required
@require_POST
def save_graph(request):
    try:
        data = json.loads(request.body)
        graph = data["graph"]
        validate_graph(
            graph,
            Challenge.objects.filter(archived=False).values_list("number", flat=True),
            Topic.objects.filter(archived=False).values_list("key", flat=True),
        )
        with transaction.atomic():
            expected = int(data.get("version", 0))
            current = CurriculumDraft.objects.select_for_update().filter(pk=data.get("id")).first()
            if current and current.version != expected:
                return error_response(ValidationError("The graph changed after you opened it. Reload before saving."), 409)
            if not current and expected != 0:
                return error_response(ValidationError("The graph draft no longer exists. Reload before saving."), 409)
            curriculum = current or CurriculumDraft(version=0)
            curriculum.graph = graph
            curriculum.version = expected + 1
            curriculum.updated_by = request.user
            curriculum.full_clean()
            curriculum.save()
            AuditRecord.objects.create(
                actor=request.user,
                action="save-graph",
                object_type="CurriculumDraft",
                object_id=str(curriculum.pk),
                changes={"fromVersion": expected, "toVersion": curriculum.version},
            )
        return JsonResponse({"ok": True, "id": curriculum.pk, "version": curriculum.version})
    except (KeyError, ValueError, json.JSONDecodeError, ValidationError) as error:
        return error_response(error)


@staff_member_required
@require_POST
def automatic_layout(request):
    try:
        data = json.loads(request.body)
        validate_graph(data["graph"])
        return JsonResponse({"ok": True, "positions": generate_layout(data["graph"], data.get("view", "journey"))})
    except (KeyError, json.JSONDecodeError, ValidationError) as error:
        return error_response(error)


@staff_member_required
@require_POST
def preview_blocks(request):
    try:
        blocks = json.loads(request.body)["blocks"]
        validate_blocks(blocks)
        return JsonResponse({"ok": True, "blocks": render_blocks(blocks)})
    except (KeyError, json.JSONDecodeError, ValidationError) as error:
        return error_response(error)


@staff_member_required
@require_POST
def publish_draft(request):
    try:
        data = json.loads(request.body or "{}")
        curriculum = CurriculumDraft.objects.get(pk=data["id"], version=data["version"])
        release = publish(curriculum, request.user)
        return JsonResponse({"ok": True, "releaseId": str(release.release_id)})
    except (KeyError, json.JSONDecodeError, CurriculumDraft.DoesNotExist, ValidationError, OSError) as error:
        return error_response(error)
