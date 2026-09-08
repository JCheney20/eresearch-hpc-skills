import io
import json
import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase, override_settings

from .layout import generate_layout
from .models import (
    AuditRecord,
    Challenge,
    ChallengeDraft,
    ChallengeRevision,
    ContentRelease,
    CurriculumDraft,
    ReleaseChallenge,
    Topic,
)
from .publication import publish
from .rendering import render_markdown, render_typst
from .validation import validate_graph

BLOCKS = [{"id": "intro", "type": "markdown", "source": "## Start\n\nRead **this**."}]
CODE = {
    "blocks": BLOCKS,
    "task": "Print the directory.",
    "answer": "/home/student",
    "hints": [],
    "commands": ["pwd"],
}


def graph(*numbers):
    return {
        "nodes": [{"number": number, "topic": "linux", "displayOrder": index} for index, number in enumerate(numbers)],
        "connections": [{"source": numbers[index - 1], "target": number} for index, number in enumerate(numbers) if index],
        "layouts": {},
    }


class ContentModelTests(TestCase):
    def setUp(self):
        self.topic = Topic.objects.create(key="linux", name="Linux")

    def challenge(self, number="000", slug="start"):
        return Challenge.objects.create(number=number, slug=slug)

    def revision(self, challenge, **changes):
        values = {
            "challenge": challenge,
            "revision": "001",
            "kind": "text",
            "title": "Read",
            "author": "Admin",
            "content": {"blocks": BLOCKS},
        }
        values.update(changes)
        return ChallengeRevision(**values)

    def test_challenge_number_is_three_uppercase_hex_digits(self):
        with self.assertRaises(ValidationError):
            Challenge(number="00f", slug="bad-number").full_clean()

    def test_text_challenge_uses_blocks_fixed_timer_and_no_world(self):
        challenge = self.challenge()
        for changes in (
            {"content": {"blocks": []}},
            {"minimum_read_seconds": 180},
            {"world": {"fs": {}}},
        ):
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                self.revision(challenge, **changes).full_clean()

    def test_block_ids_are_stable_and_unique(self):
        challenge = self.challenge()
        duplicate = BLOCKS + [{**BLOCKS[0]}]
        with self.assertRaises(ValidationError):
            self.revision(challenge, content={"blocks": duplicate}).full_clean()

    def test_code_challenge_requires_task_and_answer_or_validator(self):
        challenge = self.challenge()
        revision = self.revision(challenge, kind="code", content={"blocks": BLOCKS}, world={})
        with self.assertRaises(ValidationError):
            revision.full_clean()

    def test_revision_id_and_immutability(self):
        challenge = self.challenge("00F", "fifteen")
        revision = self.revision(challenge)
        revision.full_clean()
        revision.save()
        self.assertEqual(revision.revision_id, "00F001")
        revision.title = "Changed"
        with self.assertRaises(ValidationError):
            revision.save()

    def test_release_entry_rejects_revision_from_another_challenge(self):
        first = self.challenge("001", "first")
        second = self.challenge("002", "second")
        revision = self.revision(first)
        revision.full_clean()
        revision.save()
        entry = ReleaseChallenge(
            release=ContentRelease.objects.create(),
            challenge=second,
            revision=revision,
            topic=self.topic,
        )
        with self.assertRaises(ValidationError):
            entry.full_clean()


class GraphTests(TestCase):
    def setUp(self):
        Topic.objects.create(key="linux", name="Linux")
        Challenge.objects.create(number="000", slug="start")
        Challenge.objects.create(number="001", slug="middle")
        Challenge.objects.create(number="002", slug="leaf")

    def test_graph_rejects_cycles_and_unknown_references(self):
        cyclic = graph("000", "001")
        cyclic["connections"].append({"source": "001", "target": "000"})
        with self.assertRaises(ValidationError):
            validate_graph(cyclic, ["000", "001"], ["linux"])
        unknown = graph("000")
        unknown["nodes"].append({"number": "FFF", "topic": "linux"})
        with self.assertRaises(ValidationError):
            validate_graph(unknown, ["000"], ["linux"])

    def test_separate_cartesian_layouts_are_validated(self):
        value = graph("000", "001")
        value["layouts"] = {
            "journey": {"000": {"x": 100, "y": 20}},
            "linux": {"001": {"x": 900, "y": 200}},
        }
        CurriculumDraft(graph=value).full_clean()
        value["layouts"]["linux"]["FFF"] = {"x": 0, "y": 0}
        with self.assertRaises(ValidationError):
            CurriculumDraft(graph=value).full_clean()

    def test_generated_layout_is_deterministic_and_layered(self):
        value = graph("000", "001", "002")
        first = generate_layout(value, "linux")
        self.assertEqual(first, generate_layout(value, "linux"))
        self.assertLess(first["000"]["y"], first["001"]["y"])
        self.assertLess(first["001"]["y"], first["002"]["y"])


class RenderingTests(TestCase):
    def test_restricted_typst_renders_semantic_html_and_escapes_input(self):
        markup = render_typst('= Hello\n\nUse *bold*, `code`, and #link("https://example.com")[a link].\n\n<script>')
        self.assertIn("<h2>Hello</h2>", markup)
        self.assertIn("<strong>bold</strong>", markup)
        self.assertIn("&lt;script&gt;", markup)
        self.assertNotIn("<script>", markup)

    def test_unsupported_typst_functions_are_rejected(self):
        with self.assertRaises(ValidationError):
            render_typst('#raw("<b>unsafe</b>")')

    def test_markdown_renders_common_content_and_removes_raw_html(self):
        markup = render_markdown("## Hello\n\n**bold** and [a link](guide.md).\n\n- [x] done\n\n<script>alert(1)</script>", "https://example.com/lesson/index.md")
        self.assertIn("<h2>Hello</h2>", markup)
        self.assertIn("<strong>bold</strong>", markup)
        self.assertIn('href="https://example.com/lesson/guide.md"', markup)
        self.assertIn('type="checkbox"', markup)
        self.assertNotIn("<script>", markup)


class EditorViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("admin", password="test", is_staff=True)
        self.client.force_login(self.user)
        Topic.objects.create(key="linux", name="Linux")
        self.challenge = Challenge.objects.create(number="000", slug="start")

    def post_json(self, path, data):
        return self.client.post(path, json.dumps(data), content_type="application/json")

    def test_visual_editor_requires_staff_and_renders(self):
        response = self.client.get("/admin/curriculum-editor/")
        self.assertContains(response, "Content and graph editor")
        self.client.logout()
        self.assertEqual(self.client.get("/admin/curriculum-editor/").status_code, 302)

    def test_challenge_save_rejects_stale_version(self):
        payload = {
            "number": "000", "version": 0, "kind": "text", "title": "Start",
            "author": "Admin", "source": {}, "content": {"blocks": BLOCKS}, "world": {},
        }
        self.assertEqual(self.post_json("/admin/curriculum-editor/challenge/", payload).status_code, 200)
        self.assertEqual(self.post_json("/admin/curriculum-editor/challenge/", payload).status_code, 409)
        self.assertEqual(AuditRecord.objects.filter(action="save-draft").count(), 1)

    def test_graph_save_and_preview(self):
        response = self.post_json("/admin/curriculum-editor/graph/", {"id": None, "version": 0, "graph": graph("000")})
        self.assertEqual(response.status_code, 200)
        preview = self.post_json("/admin/curriculum-editor/preview/", {"blocks": BLOCKS})
        self.assertContains(preview, "<h2>Start</h2>")

    def test_legacy_code_challenge_cannot_be_replaced_by_admin_json(self):
        ChallengeDraft.objects.create(
            challenge=self.challenge, version=1, kind="code", title="Code", author="Admin",
            content={**CODE, "legacyManifest": {"slug": "start"}}, world={},
        )
        payload = {
            "number": "000", "version": 1, "kind": "code", "title": "Changed",
            "author": "Admin", "source": {}, "content": CODE, "world": {},
        }
        self.assertEqual(self.post_json("/admin/curriculum-editor/challenge/", payload).status_code, 409)


class BootstrapTests(TestCase):
    def test_bootstrap_imports_the_committed_release(self):
        output = io.StringIO()
        call_command("bootstrap_content", stdout=output)
        self.assertEqual(Challenge.objects.count(), 40)
        self.assertEqual(ChallengeDraft.objects.count(), 40)
        self.assertEqual(Topic.objects.count(), 3)
        self.assertEqual(len(CurriculumDraft.objects.get().graph["nodes"]), 40)
        self.assertIn("Imported 40 challenges", output.getvalue())

    def test_bootstrapped_release_can_publish_without_rewriting_legacy_content(self):
        call_command("bootstrap_content", stdout=io.StringIO())
        with tempfile.TemporaryDirectory() as output:
            with self.captureOnCommitCallbacks(execute=True):
                publish(CurriculumDraft.objects.get(), output_root=output)
            manifest = json.loads((Path(output) / "current.json").read_text())
        self.assertEqual(sum(len(topic["challenges"]) for topic in manifest["topics"]), 40)
        self.assertEqual(ChallengeRevision.objects.count(), 40)

    def test_refresh_imported_markdown_updates_a_legacy_draft(self):
        call_command("bootstrap_content", stdout=io.StringIO())
        draft = ChallengeDraft.objects.get(challenge_id="000")
        draft.content["blocks"][0]["type"] = "typst"
        draft.save(update_fields=["content"])
        call_command("refresh_imported_markdown", stdout=io.StringIO())
        draft.refresh_from_db()
        self.assertEqual(draft.content["blocks"][0]["type"], "markdown")
        self.assertEqual(AuditRecord.objects.filter(action="refresh-imported-markdown").count(), 1)


class PublicationTests(TestCase):
    def setUp(self):
        self.output = tempfile.TemporaryDirectory()
        self.addCleanup(self.output.cleanup)
        self.user = get_user_model().objects.create_user("publisher", is_staff=True)
        self.topic = Topic.objects.create(key="linux", name="Linux")
        self.challenge = Challenge.objects.create(number="000", slug="start")
        self.draft = ChallengeDraft.objects.create(
            challenge=self.challenge,
            version=1,
            kind="text",
            title="Start here",
            author="Admin",
            source={"label": "UWC HPC Skills"},
            content={"blocks": BLOCKS},
            updated_by=self.user,
        )
        value = graph("000")
        value["layouts"] = {
            "journey": {"000": {"x": 250, "y": 40}},
            "linux": {"000": {"x": 750, "y": 60}},
        }
        self.curriculum = CurriculumDraft.objects.create(version=1, graph=value, updated_by=self.user)

    def test_publication_writes_static_release_and_reuses_unchanged_revision(self):
        with self.captureOnCommitCallbacks(execute=True):
            release = publish(self.curriculum, self.user, self.output.name)
        root = Path(self.output.name)
        current = json.loads((root / "current.json").read_text())
        self.assertEqual(current["releaseId"], str(release.release_id))
        self.assertEqual(current["layouts"]["journey"]["000"], {"x": 250, "y": 40})
        self.assertTrue((root / "releases" / str(release.release_id) / "challenges" / "start.json").exists())
        self.assertTrue((root / "releases" / str(release.release_id) / "source" / "start" / "intro.md").exists())
        self.assertEqual(ChallengeRevision.objects.count(), 1)
        with self.captureOnCommitCallbacks(execute=True):
            publish(self.curriculum, self.user, self.output.name)
        self.assertEqual(ChallengeRevision.objects.count(), 1)
        self.assertEqual(AuditRecord.objects.filter(action="publish").count(), 2)
