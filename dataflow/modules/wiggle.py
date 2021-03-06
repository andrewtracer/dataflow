"""
Wiggle correction
"""

from .. import config
from ..core import Module

def wiggle_module(id=None, datatype=None, action=None,
                 version='0.0', fields=[]):
    """Module for wiggle correction"""

    icon = {
        'URI': config.IMAGES + "wiggle.png",
        'terminals': {
            'input': (0, 10, -1, 0),
            'output': (20, 10, 1, 0),
        }
    }
    
    terminals = [
        dict(id='input',
             datatype=datatype,
             use='in',
             description='data',
             required=False,
             multiple=True,
             ),
        dict(id='output',
             datatype=datatype,
             use='out',
             description='corrected data',
             ),
    ]

    amp_field = {
        "type":"float",
        "label": "amplitude",
        "name": "scale",
        "value": 0.14,
    }

    # Combine everything into a module.
    module = Module(id=id,
                  name='Wiggle',
                  version=version,
                  description=action.__doc__,
                  icon=icon,
                  terminals=terminals,
                  fields=[amp_field] + fields,
                  action=action,
                  )

    return module
