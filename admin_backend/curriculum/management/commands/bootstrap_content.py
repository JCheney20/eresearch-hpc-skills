import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from curriculum.models import Challenge, ChallengeDraft, ChallengeRevision, CurriculumDraft, Topic


class Command(BaseCommand):
    help = "Seed an empty admin database from the committed learner content manifest."

    def add_arguments(self, parser):
        parser.add_argument("manifest", nargs="?", type=Path, default=settings.BASE_DIR.parent / "content" / "current.json")

    @transaction.atomic
    def handle(self, *args, **options):
        if Challenge.objects.exists():
            raise CommandError("The admin database already contains challenges; bootstrap is empty-database only.")
        manifest_path = options["manifest"].resolve()
        project_root = settings.BASE_DIR.parent
        manifest = json.loads(manifest_path.read_text())
        graph = {"nodes": [], "connections": [], "layouts": manifest.get("layouts", {})}

        for topic_order, topic_data in enumerate(manifest["topics"]):
            topic = Topic.objects.create(
                key=topic_data["key"],
                name=topic_data["name"],
                blurb=topic_data.get("blurb", ""),
                display_order=topic_order,
            )
            for display_order, item in enumerate(topic_data["challenges"]):
                challenge = Challenge.objects.create(number=item["number"], slug=item["slug"])
                graph["nodes"].append({"number": challenge.number, "topic": topic.key, "displayOrder": display_order})
                graph["connections"].extend(
                    {"source": source, "target": challenge.number} for source in item.get("recommendedAfter", [])
                )
                kind = "text" if item["kind"] == "reading" else "code"
                blocks = self.blocks_for(item, project_root)
                content = {"blocks": blocks, "legacyManifest": item}
                if item.get("contentUrl"):
                    document = json.loads((project_root / item["contentUrl"].removeprefix("/")).read_text())
                    source = document.get("source", item.get("source", {}))
                    content["workInProgress"] = document.get("workInProgress", item.get("workInProgress", False))
                else:
                    source = item.get("source", {})
                    if kind == "code":
                        content.update({"task": "Developer-owned legacy challenge.", "validator": "legacy-module", "hints": [], "commands": item.get("commands", [])})

                values = {
                    "challenge": challenge,
                    "kind": kind,
                    "title": item["title"],
                    "author": item.get("author", "UWC HPC Skills"),
                    "source": source,
                    "minimum_read_seconds": 120,
                    "content": content,
                    "world": {},
                }
                revision = ChallengeRevision(revision=item["revision"], **values)
                revision.full_clean()
                revision.save()
                draft = ChallengeDraft(base_revision=revision.revision, version=1, **values)
                draft.full_clean()
                draft.save()

        curriculum = CurriculumDraft(version=1, graph=graph)
        curriculum.full_clean()
        curriculum.save()
        self.stdout.write(self.style.SUCCESS(
            f"Imported {Challenge.objects.count()} challenges and {Topic.objects.count()} Topics into curriculum draft {curriculum.pk}."
        ))

    def blocks_for(self, item, project_root):
        if not item.get("contentUrl"):
            return [{"id": "legacy", "type": "typst", "source": f'= {item["title"]}\n\nThis challenge currently uses bundled learner content.'}]
        document = json.loads((project_root / item["contentUrl"].removeprefix("/")).read_text())
        blocks = []
        for block in document["blocks"]:
            value = {"id": block["id"], "type": block["type"]}
            if block["type"] in {"typst", "callout"}:
                value["source"] = (project_root / block["source"].removeprefix("/")).read_text()
                if block["type"] == "callout":
                    value["style"] = block["style"]
            else:
                value.update({key: block[key] for key in ("command", "output", "mode")})
            blocks.append(value)
        return blocks
