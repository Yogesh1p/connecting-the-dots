import numpy as np

def run_test(X, K, first_idx=0):
    n = len(X)
    centers = [X[first_idx]]
    for _ in range(1, K):
        dists = np.min([np.sum((X - c)**2, axis=1) for c in centers], axis=0)
        centers.append(X[np.argmax(dists)])
    centers = np.array(centers, dtype=float)
    
    # Run Lloyd's
    prev_assignments = None
    for it in range(100):
        dists = np.array([np.sum((X - c)**2, axis=1) for c in centers])
        assignments = np.argmin(dists, axis=0)
        if np.array_equal(assignments, prev_assignments):
            break
        prev_assignments = assignments
        for k in range(K):
            pts = X[assignments == k]
            if len(pts) > 0:
                centers[k] = np.mean(pts, axis=0)
                
    lloyd_cost = sum(np.sum((X[assignments == k] - centers[k])**2) for k in range(K) if np.sum(assignments == k) > 0)
    return lloyd_cost, assignments, centers

# Let's test a setup with K=3:
# Suppose we have 3 pairs of points, or clusters.
# What if we have 4 clusters and K=3? No, K clusters!
# Suppose K=3, and OPT has 3 clusters with cost near 0.
# Can Lloyd's have cost depending on D^2?
