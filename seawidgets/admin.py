from django.contrib import admin
from seawidgets.models import Zone, Location

class ZoneAdmin(admin.ModelAdmin):
    pass

class LocationAdmin(admin.ModelAdmin):
    pass

admin.site.register(Zone, ZoneAdmin)
admin.site.register(Location, LocationAdmin)