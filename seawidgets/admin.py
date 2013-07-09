from django.contrib import admin
from seawidgets.models import Zone, Location
from django import forms


class LocationAdminForm( forms.ModelForm ):
    description = forms.CharField( widget=forms.Textarea )
    proud_heading = forms.CharField( widget=forms.Textarea )
    proud_body = forms.CharField( widget=forms.Textarea )
    class Meta:
        model = Location

class ZoneAdmin(admin.ModelAdmin):
    pass

class LocationAdmin(admin.ModelAdmin):
    form = LocationAdminForm

admin.site.register(Zone, ZoneAdmin)
admin.site.register(Location, LocationAdmin)