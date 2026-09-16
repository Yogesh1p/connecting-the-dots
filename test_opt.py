import numpy as np
from itertools import combinations

# In our dataset:
# C1: 10 points at 0
# C2: 10 points at D = 1000
# O1: 1 point at 2050
# O2: 1 point at -2050

# What if OPT clusters:
# Cluster A: C1 (10 points at 0)
# Cluster B: C2 (10 points at D)
# Cluster C: O1 and O2?
# If O1 and O2 are in Cluster C, centroid is 0. Cost = 2 * (2050)^2 ~ 8.4 * 10^6. That also has D^2.

# What if O1 and O2 are NOT at +-2050, but what if OPT groups differently?
# Let's find a construction where OPT has cost O(1) or O(eps^2)!
