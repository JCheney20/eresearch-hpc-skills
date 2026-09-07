import json
import os
import shutil
import uuid
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .layout import layout_for
from .models import AuditRecord, Challenge, ChallengeDraft, ChallengeRevision, ContentRelease, ReleaseChallenge, Topic
from .rendering import render_blocks

REVISION_FIELDS = ("kind", "title", "author", "source", "minimum_read_seconds", "content", "world")


def same_content(draft, revision):
    return revision and all(getattr(draft, field) == getattr(revision, field) for field in REVISION_FIELDS)


def next_revision(challenge):
    revisions = [int(value, 16) for value in challenge.revisions.values_list("revision", flat=True)]
    value = max(revisions, default=0) + 1
    if value > 0xFFF:
        raise ValidationError(f"Challenge {challenge.number} has exhausted its revision range.")
    return f"{value:03X}"


def revision_for(challenge, actor):
    latest = challenge.revisions.first()
    try:
        draft = challenge.draft
    except ChallengeDraft.DoesNotExist:
        if not latest:
            raise ValidationError(f"Challenge {challenge.number} has no draft or published revision.")
        return latest

    draft.full_clean()
    if draft.base_revision and (not latest or draft.base_revision != latest.revision):
        raise ValidationError(f"Challenge {challenge.number} draft is based on an old revision.")
    if same_content(draft, latest):
        return latest
    revision = ChallengeRevision(
        challenge=challenge,
        revision=next_revision(challenge),
        created_by=actor,
        **{field: getattr(draft, field) for field in REVISION_FIELDS},
    )
    revision.full_clean()
    revision.save()
    draft.base_revision = revision.revision
    draft.save(update_fields=["base_revision"])
    return revision


def write_text_challenge(root, release_id, challenge, revision):
    slug = challenge.slug
    rendered = render_blocks(revision.content["blocks"])
    blocks = []
    for block, result in zip(revision.content["blocks"], rendered):
        generated = root / "generated" / slug / f'{block["id"]}.html'
        generated.parent.mkdir(parents=True, exist_ok=True)
        generated.write_text(result["html"] + "\n")
        published = {
            "id": block["id"],
            "type": block["type"],
            "rendered": f'/content/releases/{release_id}/generated/{slug}/{block["id"]}.html',
        }
        if block["type"] in {"typst", "callout"}:
            source = root / "source" / slug / f'{block["id"]}.typ'
            source.parent.mkdir(parents=True, exist_ok=True)
            source.write_text(block["source"])
            published["source"] = f'/content/releases/{release_id}/source/{slug}/{block["id"]}.typ'
        blocks.append(published)

    document = {
        "schemaVersion": 1,
        "kind": "text",
        "title": revision.title,
        "author": revision.author,
        "updated": timezone.localdate().isoformat(),
        "minimumReadSeconds": 120,
        "source": revision.source,
        "blocks": blocks,
    }
    path = root / "challenges" / f"{slug}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2) + "\n")
    return f"/content/releases/{release_id}/challenges/{slug}.json"


def build_manifest(release_id, graph, revisions, output):
    connections = graph.get("connections", [])
    topics = {topic.key: topic for topic in Topic.objects.filter(key__in={node["topic"] for node in graph["nodes"]})}
    layouts = {"journey": layout_for(graph, "journey")}
    layouts.update({key: layout_for(graph, key) for key in topics})
    result = {"releaseId": str(release_id), "layouts": layouts, "topics": []}

    for key, topic in sorted(topics.items(), key=lambda item: (item[1].display_order, item[0])):
        topic_nodes = sorted(
            (node for node in graph["nodes"] if node["topic"] == key),
            key=lambda node: (node.get("displayOrder", 0), node["number"]),
        )
        challenges = []
        for node in topic_nodes:
            challenge, revision = revisions[node["number"]]
            if revision.kind == "code" and not revision.content.get("legacyManifest"):
                raise ValidationError(f"Code challenge {challenge.number} needs the declarative validator before it can publish.")
            item = {
                **revision.content.get("legacyManifest", {}),
                "number": challenge.number,
                "revision": revision.revision,
                "id": revision.revision_id,
                "kind": "reading" if revision.kind == "text" else "interactive",
                "slug": challenge.slug,
                "title": revision.title,
                "commands": revision.content.get("commands", revision.content.get("legacyManifest", {}).get("commands", [])),
                "author": revision.author,
                "updated": timezone.localdate().isoformat(),
                "source": revision.source or {"label": "UWC HPC Skills"},
                "recommendedAfter": [edge["source"] for edge in connections if edge["target"] == challenge.number],
            }
            if revision.content.get("legacyManifest"):
                pass
            elif revision.kind == "text":
                item.update({
                    "contentUrl": write_text_challenge(output, release_id, challenge, revision),
                    "minimumReadSeconds": 120,
                    "workInProgress": revision.content.get("workInProgress", False),
                })
            else:
                item.update({key: value for key, value in revision.content.items() if key != "blocks"})
            challenges.append(item)
        result["topics"].append({"key": key, "name": topic.name, "blurb": topic.blurb, "challenges": challenges})
    return result


def publish(curriculum, actor=None, output_root=None):
    output_root = Path(output_root or settings.CONTENT_PUBLISH_ROOT)
    curriculum.full_clean()
    release_id = uuid.uuid4()
    temporary = output_root / f".tmp-{release_id}"
    final = output_root / "releases" / str(release_id)
    shutil.rmtree(temporary, ignore_errors=True)

    with transaction.atomic():
        revisions = {}
        for node in curriculum.graph["nodes"]:
            challenge = Challenge.objects.get(number=node["number"], archived=False)
            revisions[challenge.number] = (challenge, revision_for(challenge, actor))

        manifest = build_manifest(release_id, curriculum.graph, revisions, temporary)
        temporary.mkdir(parents=True, exist_ok=True)
        (temporary / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

        release = ContentRelease.objects.create(
            release_id=release_id,
            graph=curriculum.graph,
            manifest=manifest,
            published_by=actor,
        )
        topics = {topic.key: topic for topic in Topic.objects.all()}
        for node in curriculum.graph["nodes"]:
            challenge, revision = revisions[node["number"]]
            entry = ReleaseChallenge(
                release=release,
                challenge=challenge,
                revision=revision,
                topic=topics[node["topic"]],
                display_order=node.get("displayOrder", 0),
            )
            entry.full_clean()
            entry.save()
        AuditRecord.objects.create(
            actor=actor,
            action="publish",
            object_type="ContentRelease",
            object_id=str(release_id),
            changes={"curriculumVersion": curriculum.version},
        )

        final.parent.mkdir(parents=True, exist_ok=True)
        os.replace(temporary, final)
        current_tmp = output_root / ".current.json"
        current_tmp.write_text(json.dumps(manifest, indent=2) + "\n")
        transaction.on_commit(lambda: os.replace(current_tmp, output_root / "current.json"))
    return release
