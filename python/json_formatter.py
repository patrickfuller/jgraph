#!/usr/bin/env python
"""
Some small edits to json output.
 * Float decimals are truncated to three digits
 * Nodes and edges are each on their own line
"""

from itertools import takewhile
import re
import json
from json import encoder
encoder.FLOAT_REPR = lambda o: format(o, '.3f')

load = json.load
loads = json.loads


def compress(obj):
    """Outputs json without whitespace."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'),
                      cls=CustomEncoder)


def dumps(obj):
    """Outputs json with formatting edits + object handling."""
    return json.dumps(obj, indent=4, sort_keys=True, cls=CustomEncoder)


class CustomEncoder(json.JSONEncoder):

    def encode(self, obj):
        """Fired for every object."""
        s = super(CustomEncoder, self).encode(obj)
        # If uncompressed, postprocess for formatting
        if len(s.splitlines()) > 1:
            s = self.postprocess(s)
        return s

    def postprocess(self, json_string):
        """Displays each entry on its own line."""
        is_compressing, is_hash, compressed, spaces = False, False, [], 0
        for row in json_string.split('\n'):
            if is_compressing:
                if (row[:spaces + 5] == ' ' * (spaces + 4) +
                        ('"' if is_hash else '{')):
                    compressed.append(row.rstrip())
                elif (len(row) > spaces and row[:spaces] == ' ' * spaces and
                        re.match('[\]\}],?', row[spaces:].rstrip())):
                    compressed.append(row.rstrip())
                    is_compressing = False
                else:
                    compressed[-1] += ' ' + row.strip()
            else:
                compressed.append(row.rstrip())
                if any(a in row for a in ['edges', 'nodes']):
                    # Fix to handle issues that arise with empty lists
                    if '[]' in row:
                        continue
                    spaces = sum(1 for _ in takewhile(str.isspace, row))
                    is_compressing, is_hash = True, '{' in row
        return '\n'.join(compressed)
