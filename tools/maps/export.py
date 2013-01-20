#!/usr/bin/env python
import commands
import sys

SRC_FILE = 'tmx/map.tmx'

TEMP_FILE = SRC_FILE+'.json'

DEST_FILE = '../../www/maps/world_client.js'

# Convert the Tiled TMX file to a temporary JSON file
print commands.getoutput('./tmx2json.py '+SRC_FILE+' '+TEMP_FILE)

# Map exporting
print commands.getoutput('./exportmap.js '+TEMP_FILE+' '+DEST_FILE)

# Remove temporary JSON file
print commands.getoutput('rm '+TEMP_FILE)
