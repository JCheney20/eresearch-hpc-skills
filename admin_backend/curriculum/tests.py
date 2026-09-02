from django.core.exceptions import ValidationError
from django.test import TestCase

from .models import Challenge, ChallengeRevision, ReleaseChallenge, Topic, ContentRelease


INTERACTIVE = {
    "scenario": "Scenario",
    "task": "Task",
    "answerLabel": "Answer",
    "answer": "42",
    "hints": ["one", "two", "three"],
    "example": [{"command": "pwd", "output": "/home/student"}],
    "solution": ["pwd"],
    "variants": [{"i": 0}],
}


class ContentModelTests(TestCase):
    def test_challenge_number_is_three_uppercase_hex_digits(self):
        challenge = Challenge(number="00f", slug="bad-number")
        with self.assertRaises(ValidationError):
            challenge.full_clean()

    def test_reading_challenge_rejects_a_world(self):
        challenge = Challenge.objects.create(number="000", slug="read")
        revision = ChallengeRevision(
            challenge=challenge,
            revision="001",
            kind="reading",
            title="Read",
            content={"cards": [{"title": "Card", "markdown": "Text"}]},
            world={"fs": {}},
        )
        with self.assertRaises(ValidationError):
            revision.full_clean()

    def test_interactive_challenge_requires_three_hints(self):
        challenge = Challenge.objects.create(number="001", slug="interactive")
        content = {**INTERACTIVE, "hints": ["only one"]}
        revision = ChallengeRevision(
            challenge=challenge,
            revision="001",
            kind="interactive",
            title="Interactive",
            content=content,
            world={"fs": {}},
        )
        with self.assertRaises(ValidationError):
            revision.full_clean()

    def test_revision_id_is_combined_hex_id_and_revision_is_immutable(self):
        challenge = Challenge.objects.create(number="00F", slug="fifteen")
        revision = ChallengeRevision.objects.create(
            challenge=challenge,
            revision="001",
            kind="interactive",
            title="Fifteen",
            content=INTERACTIVE,
            world={"fs": {}},
        )
        self.assertEqual(revision.revision_id, "00F001")
        revision.title = "Changed"
        with self.assertRaises(ValidationError):
            revision.save()

    def test_release_entry_rejects_a_revision_from_another_challenge(self):
        first = Challenge.objects.create(number="001", slug="first")
        second = Challenge.objects.create(number="002", slug="second")
        revision = ChallengeRevision.objects.create(
            challenge=first,
            revision="001",
            kind="interactive",
            title="First",
            content=INTERACTIVE,
            world={"fs": {}},
        )
        topic = Topic.objects.create(key="core", name="Core")
        release = ContentRelease.objects.create()
        entry = ReleaseChallenge(
            release=release,
            challenge=second,
            revision=revision,
            topic=topic,
        )
        with self.assertRaises(ValidationError):
            entry.full_clean()
