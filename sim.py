import numpy as np

def farthest_first_init(X, K, start_idx=0):
    centers = [X[start_idx]]
    for _ in range(1, K):
        dists = np.min([np.sum((X - c)**2, axis=1) for c in centers], axis=0)
        centers.append(X[np.argmax(dists)])
    return np.array(centers, dtype=float)

def lloyd(X, centers):
    K = len(centers)
    prev = None
    for _ in range(200):
        dists = np.array([np.sum((X - c)**2, axis=1) for c in centers])
        a = np.argmin(dists, axis=0)
        if np.array_equal(a, prev):
            break
        prev = a
        for k in range(K):
            if np.sum(a == k) > 0:
                centers[k] = np.mean(X[a == k], axis=0)
    cost = sum(np.sum((X[a == k] - centers[k])**2) for k in range(K) if np.sum(a == k) > 0)
    return cost, a, centers

# Let's test a simple setup:
# Suppose K = 2.
# Can K=2 be arbitrarily bad with farthest-first?
# If K=2, mu_1 is point x_1. mu_2 is the farthest point from x_1.
# Can mu_1 and mu_2 end up in the SAME optimal cluster?
# To do that, distance between points in Cluster 1 must be > distance to Cluster 2.
# But then Cluster 1 is not a cluster!

# What if K = 3?
# Can Farthest-First pick TWO centers in Cluster 1, ONE center in Cluster 2, and ZERO in Cluster 3?
# Let's test:
# Cluster 1: has two sub-parts?
# What if Cluster 1 is a line segment of length L?
# What if Cluster 2 and Cluster 3 are tight clusters of 10 points each?
