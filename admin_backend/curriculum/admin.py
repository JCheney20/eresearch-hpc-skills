from django.contrib import admin

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


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "display_order", "archived")
    list_editable = ("display_order", "archived")
    ordering = ("display_order",)


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("number", "slug", "archived")
    search_fields = ("number", "slug")


@admin.register(ChallengeDraft)
class ChallengeDraftAdmin(admin.ModelAdmin):
    list_display = ("challenge", "title", "kind", "version", "updated_at", "updated_by")
    readonly_fields = ("version", "updated_at", "updated_by")
    search_fields = ("challenge__number", "challenge__slug", "title")


@admin.register(CurriculumDraft)
class CurriculumDraftAdmin(admin.ModelAdmin):
    list_display = ("id", "version", "updated_at", "updated_by")
    readonly_fields = ("version", "updated_at", "updated_by")


class ImmutableAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return obj is None

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ChallengeRevision)
class ChallengeRevisionAdmin(ImmutableAdmin):
    list_display = ("revision_id", "title", "kind", "created_at", "created_by")
    search_fields = ("challenge__number", "challenge__slug", "title")


@admin.register(ContentRelease)
class ContentReleaseAdmin(ImmutableAdmin):
    list_display = ("release_id", "published_at", "published_by")


@admin.register(ReleaseChallenge)
class ReleaseChallengeAdmin(ImmutableAdmin):
    list_display = ("release", "challenge", "revision", "topic", "display_order")


@admin.register(AuditRecord)
class AuditRecordAdmin(ImmutableAdmin):
    list_display = ("created_at", "actor", "action", "object_type", "object_id")
    search_fields = ("action", "object_type", "object_id")
