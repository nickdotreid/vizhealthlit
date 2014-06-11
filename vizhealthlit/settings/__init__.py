"""
Settings used by vizhealthlit project.

This consists of the general produciton settings, with an optional import of any local
settings.
"""

# Import production settings.
from vizhealthlit.settings.production import *

# Import optional local settings.
try:
    from vizhealthlit.settings.local import *
except ImportError:
    pass