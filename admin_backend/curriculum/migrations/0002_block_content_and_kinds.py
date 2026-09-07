from django.db import migrations, models


def rename_kinds(apps, schema_editor):
    for name in ("ChallengeDraft", "ChallengeRevision"):
        model = apps.get_model("curriculum", name)
        model.objects.filter(kind="reading").update(kind="text")
        model.objects.filter(kind="interactive").update(kind="code")


def restore_kinds(apps, schema_editor):
    for name in ("ChallengeDraft", "ChallengeRevision"):
        model = apps.get_model("curriculum", name)
        model.objects.filter(kind="text").update(kind="reading")
        model.objects.filter(kind="code").update(kind="interactive")


class Migration(migrations.Migration):
    dependencies = [("curriculum", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="challengedraft",
            name="author",
            field=models.CharField(default="UWC HPC Skills", max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="challengedraft",
            name="source",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="challengedraft",
            name="minimum_read_seconds",
            field=models.PositiveSmallIntegerField(default=120),
        ),
        migrations.AddField(
            model_name="challengerevision",
            name="author",
            field=models.CharField(default="UWC HPC Skills", max_length=200),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="challengerevision",
            name="source",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="challengerevision",
            name="minimum_read_seconds",
            field=models.PositiveSmallIntegerField(default=120),
        ),
        migrations.RunPython(rename_kinds, restore_kinds),
        migrations.AlterField(
            model_name="challengedraft",
            name="kind",
            field=models.CharField(choices=[("text", "Text"), ("code", "Code")], max_length=4),
        ),
        migrations.AlterField(
            model_name="challengerevision",
            name="kind",
            field=models.CharField(choices=[("text", "Text"), ("code", "Code")], max_length=4),
        ),
    ]
