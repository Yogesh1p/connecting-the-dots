---
layout: page
title: Positional encoding
description: Why self-attention needs order, and how sinusoidal geometry evolves into RoPE.
keywords: Sinusoidal, RoPE
chapter: Autoregressive Models
interactive: pos_enc
date created: 2026-04-03
last_modified_at: 2026-04-03
---

## Transformer-Based Models and Practical Tricks

In Chapter 1, we developed the Transformer as the modern solution to variable-length autoregressive modeling. Self-attention gave us a scalable mechanism for relating all tokens in a sequence, replacing the recurrence bottleneck of RNNs.

But the vanilla Transformer architecture is only the starting point.

Turning this architecture into a practical large language model requires a series of design refinements: how to encode token order, how to reduce attention cost, how to structure query-key-value heads efficiently, and how to scale the decoder for inference.

These refinements do not change the fundamental autoregressive factorization. Instead, they improve the geometry, efficiency, and systems behavior of the Transformer at scale.

We begin with the first and most fundamental refinement: *how to inject positional structure into an otherwise permutation-invariant attention mechanism.*

Self-attention compares tokens through similarity in content space. Given token representations $x_1, x_2, \dots, x_n$, the attention score between positions $i$ and $j$ is

$$
s_{ij} = q_i^\top k_j
$$

This mechanism is remarkably powerful, but it comes with a fundamental limitation: *self-attention is permutation-invariant*. If the token embeddings are kept the same while their order is shuffled, the architecture itself has no built-in notion of which token came first.

This is catastrophic for language, where order carries meaning.

Consider the two sentences:

> Avengers defeated Thanos  
> Thanos defeated Avengers

The words are identical, yet the meanings are opposite. Language therefore depends not only on *which words appear*, but also on *the order in which they appear*.

This gives us the first requirement:

> The model must distinguish the same words appearing in different positions.

A second requirement comes from linguistic locality. In phrases such as

$$
\text{not happy}, \qquad \text{red car}, \qquad \text{very large}
$$

nearby words interact most strongly. Positional structure should therefore make *small relative offsets easy to detect*.

**Key Concept** :
Positional encoding should help attention heads do two things:
1. Infer word order in the sentence
2. Assign stronger attention to nearby words when needed

## A naive positional signal

A first idea might be to attach the token index directly to the embedding. If the token embedding is $e_i \in \mathbb{R}^d$, we could append the scalar position:

$$
\tilde e_i =
\begin{bmatrix}
e_i \\
i
\end{bmatrix}
$$

This certainly breaks permutation invariance: the same word appearing at different locations now produces different representations.

However, this creates several problems.

First, the raw position index is just a scalar, while the semantic embedding lives in a high-dimensional feature space. The appended coordinate does not naturally interact with the rest of the embedding dimensions.

Second, raw integers impose an arbitrary notion of scale. Position $100$ is not meaningfully “ten times more positional” than position $10$, yet dot products would treat it that way.

Most importantly, attention works through inner products in a shared vector space. To let position interact naturally with semantic similarity, it should live in the *same dimensional geometry* as the token embedding itself.

### Position as a vector in embedding space

Instead of a scalar index, we therefore assign each position its own vector

$$
PE(i) \in \mathbb{R}^d
$$

with the same dimensionality as the token embedding.

The simplest integration is additive:

$$
h_i = e_i + PE(i)
$$

where $e_i$ denotes the token embedding.

To isolate the geometric role of position, first consider the simplified case where the query and key projections act as identity maps:

$$
W_Q = W_K = I
$$

The attention score then becomes

$$
s_{ij} = (e_i + PE(i))^\top (e_j + PE(j))
$$

allowing similarity to depend on both semantic content and token position.

## What structure should positional similarity have?

At this point, position influences attention through inner products. So the usefulness of a positional map depends on the geometry it induces under dot products.

Expanding the score:

$$
s_{ij}
=
e_i^\top e_j
+
e_i^\top PE(j)
+
PE(i)^\top e_j
+
PE(i)^\top PE(j)
$$

The first term captures semantic similarity. The middle terms mix content and position. But the last term is especially important: it describes how positional similarity alone contributes to attention.

For locality-sensitive patterns, we would like this term to reveal how far apart two tokens are. Ideally,

$$
PE(i)^\top PE(j)
$$

should depend mainly on the relative offset $(i-j)$ rather than on the absolute positions themselves.

### A geometric constraint

At this point, positional information enters attention through inner products. So if nearby positions should interact more strongly, we want

$$
PE(i)^\top PE(j)
$$

to be larger when $i$ and $j$ are close.

A naive way to increase dot products would be to simply increase vector magnitudes. But that would make the positional signal depend on scale rather than structure, which is unstable and hard to interpret.

A cleaner design is to keep all positional vectors at the same norm, so that similarity depends only on their relative orientation.

With fixed magnitude, the only way for dot products to change is through the *angle* between vectors. Nearby positions should therefore correspond to nearby angles, while larger offsets create larger angular differences.

In two dimensions, all unit vectors lie on the unit circle.

So the simplest positional geometry is to place each position as a point moving smoothly around that circle:

$$
PE_\omega(i)=
\begin{bmatrix}
\cos(\omega i) \\
\sin(\omega i)
\end{bmatrix}
$$

{% include figures/pos_enc/unit_circle.html name="unit-circle" %}

Advancing one token changes the angle slightly. Advancing by $k$ tokens changes it by $\omega k$. Position shifts in token space therefore become angular shifts in feature space.

### Why dot products recover relative position

Now compare two positions $i$ and $j$:

$$
PE_\omega(i)^\top PE_\omega(j)
=
\cos(\omega i)\cos(\omega j)
+
\sin(\omega i)\sin(\omega j)
$$

Using the trigonometric identity

$$
\cos A \cos B + \sin A \sin B = \cos(A-B)
$$

this simplifies to

$$
PE_\omega(i)^\top PE_\omega(j)
=
\cos\bigl(\omega(i-j)\bigr)
$$

This is exactly the structure we wanted. The absolute positions disappear, and the similarity depends only on the relative offset.

{% include figures/pos_enc/relative_similarity.html %}

So the angle between two positional vectors directly encodes how far apart the tokens are in the sequence.

## Why one frequency is not enough

A single circle captures positional offsets only at one scale.

If $\omega$ is large, even small shifts in token index produce large angular changes. This makes nearby positions highly distinguishable, which is useful for local syntax. But the representation wraps around quickly.

If $\omega$ is small, the angle changes slowly. This preserves distinguishability over long ranges, but nearby positions become too similar.

{% include figures/pos_enc/high_low_frequency.html %}

So a single frequency forces a trade-off:

- high frequency gives precise local resolution
- low frequency preserves long-range identity

Language needs both.

## Many frequencies, many circles

The solution is to use multiple angular frequencies

$$
\omega_1, \omega_2, \dots, \omega_m
$$

Each frequency contributes one rotating circle, and the final positional representation concatenates all of them:

$$
PE(i)=
\begin{bmatrix}
\sin(\omega_1 i) \\
\cos(\omega_1 i) \\
\sin(\omega_2 i) \\
\cos(\omega_2 i) \\
\vdots \\
\sin(\omega_m i) \\
\cos(\omega_m i)
\end{bmatrix}
$$

Each adjacent pair forms one rotational plane evolving at its own speed.

{% include figures/pos_enc/multi_frequency.html %}

Fast frequencies behave like fine-grained local clocks, while slow frequencies preserve identity over long contexts.

## The Transformer sinusoidal encoding

The Transformer chooses these frequencies geometrically:

$$
\omega_k = \frac{1}{10000^{2k/d}}
$$

This creates a spectrum ranging from rapid local oscillations to extremely slow global rotations.

The result is a deterministic, parameter-free Fourier feature map over token index.

## The limitation of absolute encoding

With absolute sinusoidal encoding, the positional vector is first added to the token embedding:

$$
h_i = e_i + PE(i)
$$

The query and key are then formed as

$$
q_i = W_Q h_i = W_Q(e_i + PE(i))
$$

$$
k_j = W_K h_j = W_K(e_j + PE(j))
$$

So the attention score becomes

$$
q_i^\top k_j
=
(W_Q(e_i+PE(i)))^\top
(W_K(e_j+PE(j)))
$$

The relative phase structure is therefore only *implicitly preserved*.

A more natural design is to place the positional rotation directly on the query and key vectors themselves.

This leads to Rotary Positional Embeddings (RoPE).

## Rotary Positional Embeddings (RoPE)

RoPE applies the positional phase directly to projected query and key vectors.

For a two-dimensional subspace, define the position-dependent rotation

$$
R(i)=
\begin{bmatrix}
\cos\theta_i & -\sin\theta_i \\
\sin\theta_i & \cos\theta_i
\end{bmatrix},
\qquad
\theta_i = \omega i
$$

The rotated query and key are

$$
q_i' = R(i)\,W_Q e_i
$$

$$
k_j' = R(j)\,W_K e_j
$$

Their attention score is

$$
(q_i')^\top k_j'
=
(W_Q e_i)^\top R(i)^\top R(j)(W_K e_j)
$$

Now use the fact that the transpose of a rotation is its inverse:

$$
R(i)^\top = R(-i)
$$

So

$$
R(i)^\top R(j)=R(-i)R(j)
$$

Rotations compose by adding angles:

$$
R(a)R(b)=R(a+b)
$$

Therefore

$$
R(-i)R(j)=R(j-i)
$$

Substituting back:

$$
(q_i')^\top k_j'
=
(W_Q e_i)^\top R(j-i)(W_K e_j)
$$

So the absolute positions collapse into a single relative rotation.

## Learned positional embeddings

An alternative is to make $PE(i)$ a trainable parameter vector for each position.

In practice, learned embeddings often work well within the context lengths seen during training. However, they extrapolate poorly beyond training length.

## Relative bias and ALiBi

A different philosophy is to encode position directly as a bias on the attention score.

For example, ALiBi adds a learned linear penalty proportional to token distance:

$$
s_{ij}=q_i^\top k_j - m_h|i-j|
$$

where $m_h$ is a head-specific slope.

This directly encourages locality while extrapolating naturally to long contexts.

## Why RoPE became dominant

RoPE is especially attractive for decoder-only LLMs because relative offsets are encoded directly in attention geometry.

This is why most modern frontier LLMs use RoPE or scaled variants.

> **Key Takeaway**
>
> - Absolute PE injects position before projection
> - RoPE injects position directly into query–key geometry
> - ALiBi injects position as an attention-score bias
>
> The real design choice is **where position enters similarity computation**.