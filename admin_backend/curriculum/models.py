import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models

hex3 = RegexValidator(r"^[0-9A-F]{3}$", "Use three uppercase hexadecimal digits.")


class Topic(models.Model):
    key = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    blurb = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["display_order", "key"]

    def __str__(self):
        return self.name


class Challenge(models.Model):
    number = models.CharField(primary_key=True, max_length=3, validators=[hex3])
    slug = models.SlugField(unique=True)
    archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["number"]

    def __str__(self):
        return f"{self.number} · {self.slug}"


class ChallengeContent(models.Model):
    class Kind(models.TextChoices):
        READING = "reading", "Reading"
        INTERACTIVE = "interactive", "Interactive"

    kind = models.CharField(max_length=11, choices=Kind.choices)
    title = models.CharField(max_length=200)
    content = models.JSONField(default=dict)
    world = models.JSONField(default=dict, blank=True)

    class Meta:
        abstract = True

    def clean(self):
        super().clean()
        if self.kind == self.Kind.READING:
            if not self.content.get("cards"):
                raise ValidationError({"content": "A reading challenge needs cards."})
            if self.world:
                raise ValidationError({"world": "A reading challenge cannot have a world."})
            return

        required = {"scenario", "task", "answerLabel", "answer", "hints", "example", "solution", "variants"}
        missing = sorted(required - self.content.keys())
        if missing:
            raise ValidationError({"content": f"Missing interactive fields: {', '.join(missing)}."})
        if len(self.content["hints"]) != 3:
            raise ValidationError({"content": "An interactive challenge needs exactly three hints."})
        if not isinstance(self.world, dict):
            raise ValidationError({"world": "World must be a declarative object."})


class ChallengeDraft(ChallengeContent):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE, related_name="draft")
    base_revision = models.CharField(max_length=3, validators=[hex3], blank=True)
    version = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Draft {self.challenge_id} v{self.version}"


class ChallengeRevision(ChallengeContent):
    challenge = models.ForeignKey(Challenge, on_delete=models.PROTECT, related_name="revisions")
    revision = models.CharField(max_length=3, validators=[hex3])
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(
            fields=["challenge", "revision"], name="unique_challenge_revision"
        )]
        ordering = ["challenge_id", "-revision"]

    @property
    def revision_id(self):
        return f"{self.challenge_id}{self.revision}"

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError("Published challenge revisions are immutable.")
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.revision_id


class CurriculumDraft(models.Model):
    version = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    graph = models.JSONField(default=dict)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Curriculum draft v{self.version}"


class ContentRelease(models.Model):
    release_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    graph = models.JSONField(default=dict)
    manifest = models.JSONField(default=dict)
    published_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    published_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError("Published content releases are immutable.")
        return super().save(*args, **kwargs)

    def __str__(self):
        return str(self.release_id)


class ReleaseChallenge(models.Model):
    release = models.ForeignKey(ContentRelease, on_delete=models.CASCADE, related_name="challenge_entries")
    challenge = models.ForeignKey(Challenge, on_delete=models.PROTECT)
    revision = models.ForeignKey(ChallengeRevision, on_delete=models.PROTECT)
    topic = models.ForeignKey(Topic, on_delete=models.PROTECT)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [models.UniqueConstraint(
            fields=["release", "challenge"], name="one_revision_per_challenge_per_release"
        )]
        ordering = ["topic__display_order", "display_order"]

    def clean(self):
        super().clean()
        if self.revision_id and self.challenge_id and self.revision.challenge_id != self.challenge_id:
            raise ValidationError({"revision": "Revision must belong to the selected challenge."})


class AuditRecord(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=80)
    object_type = models.CharField(max_length=80)
    object_id = models.CharField(max_length=200)
    changes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError("Audit records are immutable.")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.action} · {self.object_type} {self.object_id}"
