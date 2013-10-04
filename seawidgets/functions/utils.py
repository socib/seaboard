# coding: utf-8

import datetime
from dateutil import tz
import imghdr
import os
from math import radians, cos, sin, asin, sqrt

# IMAGE AND PATH FUNCTIONS
def isimage(path):
    """Determine if a given file is an image, using imghdr module.

    :param path: filesystem path and filename.
    """
    try:
        return imghdr.what(path)
    except Exception:
        return False


# DATE FUNCTIONS
def unix_time(dt):
    """Get seconds since epoch time."""

    epoch = datetime.datetime.utcfromtimestamp(0)
    delta = dt - epoch
    return delta.total_seconds()


def unix_time_millis(dt):
    return unix_time(dt) * 1000.0


def utc_to_local(dt):
    """Datetime expressed in UTC to local time."""
    local = tz.tzlocal()
    UTC = tz.gettz('UTC')
    dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(local)


def strftime_from_millis(milis,format='%d/%m/%Y %H:%M'):
    """Format datetime expressed in milliseconds in a given format."""
    epoch = utc_to_local(datetime.datetime.utcfromtimestamp(milis/1000.0))
    return epoch.strftime(format)


# from http://codrspace.com/glenbot/tail-a-file-in-python/
def tail(f, lines=1, _buffer=1024):
    """Tail a file and get X lines from the end"""
    # place holder for the lines found
    lines_found = []

    # block counter will be multiplied by buffer
    # to get the block size from the end
    block_counter = -1

    # loop until we find X lines
    while len(lines_found) < lines:
        try:
            f.seek(block_counter * _buffer, os.SEEK_END)
        except IOError:  # either file is too small, or too many lines requested
            f.seek(0)
            lines_found = f.readlines()
            break

        lines_found = f.readlines()

        # we found enough lines, get out
        if len(lines_found) > lines:
            break

        # decrement the block counter to get the
        # next X bytes
        block_counter -= 1

    return lines_found[-lines:]


def decimalDegrees2DMS(value,type):
    """
        Converts a Decimal Degree Value into
        Degrees Minute Seconds Notation.

        Pass value as double
        type = {Latitude or Longitude} as string

        returns a string as D:M:S:Direction
        created by: anothergisblog.blogspot.com
    """

    if isinstance(value, str):
        value = float(value)

    degrees = int(value)
    submin = abs( (value - int(value) ) * 60)
    minutes = int(submin)
    subseconds = abs((submin-int(submin)) * 60)
    direction = ""
    if type == "Longitude":
        if degrees < 0:
            direction = "W"
        elif degrees > 0:
            direction = "E"
        else:
            direction = ""
    elif type == "Latitude":
        if degrees < 0:
            direction = "S"
        elif degrees > 0:
            direction = "N"
        else:
            direction = ""
    notation = str(degrees) + "°" + str(minutes) + "'" +\
               str(subseconds)[0:5] + "\"" + direction
    return notation

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    """
    if lon1 is None or lat1 is None or lon2 is None or lat2 is None: return -1
    try:
        # convert decimal degrees to radians
        lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])
        # haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6367 * c
        return km
    except Exception as e:
        print 'Error calculating harvesine... ', type(e), e.args
        return -1
