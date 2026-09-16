import numpy as np

def run_sim(X, K, init_idx=0):
    centers = [X[init_idx]]
    for _ in range(1, K):
        dists = np.min([np.sum((X - c)**2, axis=1) for c in centers], axis=0)
        centers.append(X[np.argmax(dists)])
    centers = np.array(centers, dtype=float)
    
    # Lloyd's
    prev_a = None
    for _ in range(100):
        dists = np.array([np.sum((X - c)**2, axis=1) for c in centers])
        a = np.argmin(dists, axis=0)
        if np.array_equal(a, prev_a):
            break
        prev_a = a
        for k in range(K):
            if np.sum(a == k) > 0:
                centers[k] = np.mean(X[a == k], axis=0)
    
    cost = sum(np.sum((X[a == k] - centers[k])**2) for k in range(K) if np.sum(a == k) > 0)
    return cost, a, centers

# Consider 10 points in 1D or 2D:
# Suppose K = 2.
# Can K=3 work?
# Let's test a case where K=3.
# Cluster 1: 5 points near 0
# Cluster 2: 5 points near D
# Outlier 1: 1 point at -L ?
# Let's test!
