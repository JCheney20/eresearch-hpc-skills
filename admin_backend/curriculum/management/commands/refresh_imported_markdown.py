"""Refresh imported text drafts from the committed Markdown source files."""

import json

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from curriculum.models import AuditRecord, ChallengeDraft


class Command(BaseCommand):
    help = "Replace imported Typst draft blocks with their committed Markdown equivalents."

    def handle(self, *args, **options):
        updated = 0
        root = settings.BASE_DIR.parent
        with transaction.atomic():
            for draft in ChallengeDraft.objects.select_related("challenge"):
                manifest = draft.content.get("legacyManifest", {})
                content_url = manifest.get("contentUrl")
                if not content_url:
                    continue
                document = json.loads((root / content_url.removeprefix("/")).read_text())
                blocks = self.blocks_for(document, root)
                if draft.content.get("blocks") == blocks:
                    continue
                draft.content = {**draft.content, "blocks": blocks}
                draft.version += 1
                draft.full_clean()
                draft.save(update_fields=["content", "version", "updated_at"])
                AuditRecord.objects.create(
                    action="refresh-imported-markdown",
                    object_type="ChallengeDraft",
                    object_id=draft.challenge_id,
                    changes={"toVersion": draft.version},
                )
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Refreshed {updated} imported Markdown drafts."))

    @staticmethod
    def blocks_for(document, root):
        blocks = []
        for block in document["blocks"]:
            value = {"id": block["id"], "type": block["type"]}
            if block["type"] in {"markdown", "typst", "callout"}:
                value["source"] = (root / block["source"].removeprefix("/")).read_text()
                if block["type"] == "callout":
                    value["style"] = block["style"]
            else:
                value.update({key: block[key] for key in ("command", "output", "mode")})
            blocks.append(value)
        return blocks
