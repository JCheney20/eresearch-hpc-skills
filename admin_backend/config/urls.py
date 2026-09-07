"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from curriculum import views

urlpatterns = [
    path("admin/curriculum-editor/", views.editor, name="curriculum-editor"),
    path("admin/curriculum-editor/challenge/", views.save_challenge, name="curriculum-save-challenge"),
    path("admin/curriculum-editor/graph/", views.save_graph, name="curriculum-save-graph"),
    path("admin/curriculum-editor/layout/", views.automatic_layout, name="curriculum-auto-layout"),
    path("admin/curriculum-editor/preview/", views.preview_blocks, name="curriculum-preview"),
    path("admin/curriculum-editor/publish/", views.publish_draft, name="curriculum-publish"),
    path("admin/", admin.site.urls),
]
