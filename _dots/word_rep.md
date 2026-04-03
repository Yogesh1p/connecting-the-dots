---
layout: page
title: Word representation
description: How do we represent words as mathematical objects? The distributional hypothesis and the Word2Vec model.
keywords: " Skipgram, CBOW"
chapter: Autoregressive Models
date created: 2026-04-03
last_modified_at: 2026-04-03
---
 

Words, however, are discrete symbols without any inherent numerical representation. Before we can model sequences of words, we must therefore answer a more fundamental question:

_How do we represent a word as a mathematical object?_

## Words to Vectors

### The Naive Approach and Why It Fails

The most obvious answer to "how do we represent a word as a mathematical object" is to assign each word a unique integer. Fix a vocabulary $\mathcal{V}$ of size $V$ — the set of all distinct words the model will ever encounter — and map each word to an index:

$$\text{coffee} \mapsto 1, \quad \text{tea} \mapsto 2, \quad \text{the} \mapsto 3, \quad \dots$$

This is compact and unambiguous, but it smuggles in a false assumption: that numbers are ordered. The model would be forced to treat "tea" as _between_ "coffee" and "the" in some meaningful sense. It is not. Any arithmetic on these integers would be nonsense.

**Second attempt: one-hot vectors.** Instead of a single integer, give each word a vector of length $V$ that is all zeros except for a single $1$ at the position corresponding to that word:

$$\mathbf{e}_{\text{coffee}} = (1, 0, 0, \dots),\quad \mathbf{e}_{\text{tea}} = (0, 1, 0, \dots),\quad \mathbf{e}_{\text{the}} = (0, 0, 1, \dots).$$

Formally, for a word $w$ with vocabulary index $i(w)$:

$$(\mathbf{e}_w)_j = \begin{cases} 1 & j = i(w) \\ 0 & \text{otherwise.} \end{cases}$$

This removes the false ordering. But it creates a new problem.

**One-hot vectors have no geometry.**

Interactive — One-Hot Encoding

Every pair of distinct words sits exactly distance $\sqrt{2}$ apart — the representation carries no information about which words are related.

Every pair of distinct words is exactly equidistant:

$$\|\mathbf{e}_w - \mathbf{e}_{w'}\| = \sqrt{2} \qquad \text{for all } w \neq w'.$$

Equivalently, every dot product between distinct words is zero:

$$\mathbf{e}_{\text{coffee}}^\top \mathbf{e}_{\text{tea}} \;=\; \mathbf{e}_{\text{coffee}}^\top \mathbf{e}_{\text{the}} \;=\; 0.$$

"Coffee" is exactly as far from "tea" as it is from "the." The representation contains no information about which words are related.

This means there is no generalization. A model learning that "coffee" is a drink cannot apply that knowledge to "tea" — from the representation's perspective, they are unrelated objects.

These are not minor inconveniences. They mean that any model operating on one-hot vectors must learn the behavior of every word from scratch, with zero transfer between related words. For a vocabulary of hundreds of thousands of words, this is a fundamental barrier.

### What We Actually Need

The failure of one-hot vectors is precise: they treat every word as equally dissimilar. What we need is a representation where **similar words are close together** in some geometric space. But close according to what?

We need a notion of word similarity that can be extracted from data, without anyone hand-labeling which words are related. The key insight comes from an observation in linguistics:

**The distributional hypothesis:** words that appear in similar contexts tend to have similar meanings.

Consider two words you have never seen before: _grutt_ and _blarpen_. You encounter them in the following sentences:

Demonstration — Context Reveals Meaning

"I drank a hot grutt this morning."

"She ordered a blarpen at the café."

"The grutt was bitter and dark."

"He prefers blarpen to tea."

Context words shared by _both_ unknown words (highlighted):

drank hot morning café bitter tea the a was he

You do not know what these words mean, but you know they mean something similar — because they appear near the same words: _drank, hot, morning, café, bitter, tea_. The context is the meaning.

This gives us a concrete strategy: represent each word by the _company it keeps_.

### Count Vectors and Their Limits

The most direct implementation: scan a large corpus and count how often each word appears near every other word. Define a _co-occurrence matrix_ $C \in \mathbb{R}^{V \times V}$ where $C_{ij}$ records how often word $j$ appears within a fixed window of word $i$.

The row $C_{i,:}$ then describes the full distribution of linguistic contexts for word $i$ — a vector representation that embodies the distributional hypothesis directly. Words with similar rows have similar contexts, and therefore similar meanings.

**This works.** In practice, words like "coffee" and "tea" do end up with similar rows. But it creates two practical problems.

**Two failures of count vectors.**

**Scale.** With $V = 100{,}000$ words, $C$ has $10^{10}$ entries. Storing and manipulating this matrix is expensive. Most entries are zero — the matrix is extremely sparse.

**Rigidity.** The matrix must be recomputed from scratch whenever new text is available. There is no way to update it incrementally.

The standard fix for the scale problem is **singular value decomposition (SVD)**: approximate $C$ by a low-rank matrix, keeping only the $d$ most important dimensions. This compresses each row from a $V$-dimensional sparse vector into a dense $d$-dimensional vector, with $d \in \{50, 100, 300\}$. The result is a compact, dense representation for each word that still captures co-occurrence structure.

This works, but it remains a two-stage pipeline: collect counts, then factorize.

_Can we learn the same dense representations directly, in a single pass over text?_

This question leads directly to one of the central ideas of neural networks: **representation learning**.

Rather than hand-designing a feature space from co-occurrence counts and then compressing it with singular value decomposition (SVD), we can train a model whose hidden parameters _become_ the representation itself. The network learns a geometric space in which words appearing in similar contexts acquire nearby vectors.

This is the general pattern of deep learning: internal layers are not merely intermediate computations, but learned representations that reorganize raw inputs into spaces where the prediction task becomes easier.

## Learning Vectors Directly: Word2Vec

Word2Vec is a family of shallow neural network models designed to learn dense vector representations of words directly from raw text. Rather than assigning meaning by hand, it learns word vectors by solving a prediction task: a word should have a useful vector if that vector helps predict the words that appear around it.

The central idea is simple: _words used in similar contexts should end up with similar vectors_. The geometry of the learned embedding space therefore emerges from the statistics of neighboring words in the corpus.

Word2Vec turns representation learning into a prediction problem: a word vector is useful if it helps predict the words that appear nearby. Similarity in meaning is therefore learned through similarity in context.

Each word $w$ is assigned a trainable vector $\mathbf{v}_w \in \mathbb{R}^d$. All vectors are collected into an _embedding matrix_:

$$E \in \mathbb{R}^{d \times V},$$

where column $i$ holds the vector for the $i$-th vocabulary word. Given a word $w$ with one-hot vector $\mathbf{e}_w$, its embedding is:

$$\mathbf{v}_w = E\,\mathbf{e}_w = E_{:,\,i(w)}.$$

This is just column selection — the one-hot vector picks out a single column of $E$. The matrix $E$ is learned end-to-end during training.

_A note on terminology._ Each word appears in two roles: sometimes it is the word being predicted _from_ (the center word), sometimes it is the word being predicted (the context word). We give each word two separate vectors — $\mathbf{v}_w$ for when it acts as center, $\mathbf{u}_w$ for when it acts as context — and learn both independently. This works better in practice than sharing a single vector.

### The Skipgram Objective

The training task is: _given a center word, predict which words appear nearby._

For a sentence like "I drank hot coffee this morning," treating **coffee** as the center word with window size $k=2$ generates the training pairs:

$$(\text{coffee},\,\text{hot}),\quad (\text{coffee},\,\text{drank}),\quad (\text{coffee},\,\text{this}),\quad (\text{coffee},\,\text{morning}).$$

Interactive — Skipgram Training Pairs (window $k = 2$)

Click any word to set it as the center word

For each pair, the model should assign high probability to the observed context word and low probability to words that did not appear. To score how compatible a center word $c$ and context word $o$ are, we use their dot product:

$$\mathbf{u}_o^\top \mathbf{v}_c.$$

When two vectors point in the same direction, their dot product is large. Training will push the vectors of co-occurring words to align — which is exactly what encodes "these words belong together." Converting scores to probabilities via softmax:

$$p(o \mid c) = \frac{\exp(\mathbf{u}_o^\top \mathbf{v}_c)}{\displaystyle\sum_{w \in \mathcal{V}} \exp(\mathbf{u}_w^\top \mathbf{v}_c)}.$$

Training maximizes this probability across all observed center–context pairs in the corpus.

### What the Gradient Actually Does

The gradient of the log-probability with respect to the center vector $\mathbf{v}_c$ is:

$$\nabla_{\mathbf{v}_c} \log p(o \mid c) = \underbrace{\mathbf{u}_o}_{\substack{\text{observed} \\ \text{context}}} \;-\; \underbrace{\sum_{x \in \mathcal{V}} p(x \mid c)\,\mathbf{u}_x}_{\substack{\text{model's current} \\ \text{expected context}}}.$$

This is a correction signal. The update moves $\mathbf{v}_c$ **toward the vector of the word that actually appeared** and **away from the weighted average of all words the model currently predicts**. If the model is already confident about the right context word, the correction is small. If it is confidently wrong, the correction is large.

Repeat this over every center–context pair in the corpus — billions of small corrections, each one nudging vectors toward or away from each other.

Words that share contexts get pulled toward each other. Words that never share contexts drift apart. The geometry of the embedding space becomes a map of linguistic relatedness.

### CBOW

Skipgram asks: _given this word, what surrounds it?_ **Continuous Bag of Words (CBOW)** flips the question: _given the surroundings, what is the missing word?_ The context vectors are averaged and fed through the same softmax to predict the center.

Averaging multiple context signals makes CBOW faster and more stable for common words. But averaging also smooths out the contribution of any individual context word — rare words, which appear in few contexts, receive weaker gradient signal. Skipgram, treating each center–context pair as a separate training example, gives rare words more updates.

||Skipgram|CBOW|
|---|---|---|
|Training speed|Slower|Faster|
|Rare words|Better|Worse|
|Frequent words|Worse|Better|
|Analogy tasks|Better|Worse|

## What the Geometry Encodes

After training, the embedding space shows a simple but useful structure: some word relationships appear as consistent shifts (offsets) between vectors. This behavior is not explicitly programmed — it emerges from the training process.

A well-known example is the gender–royalty relationship:

$$\mathbf{v}_{\text{king}} - \mathbf{v}_{\text{man}} + \mathbf{v}_{\text{woman}} \approx \mathbf{v}_{\text{queen}}.$$

This example is often highlighted, but it should not be overinterpreted. The similarity is only moderate, and such relationships do not always hold reliably across all word combinations.

More reliable patterns appear in simpler and more regular relationships, especially in language structure. In these cases, the same vector difference shows up repeatedly across many examples:

Interactive — Vector Analogies

**Consistent Patterns in Static Embeddings**

|Relationship|Observed pattern|
|---|---|
|Verb forms|$\mathbf{v}_{\text{walking}} - \mathbf{v}_{\text{walk}} \approx \mathbf{v}_{\text{running}} - \mathbf{v}_{\text{run}} \approx \mathbf{v}_{\text{swimming}} - \mathbf{v}_{\text{swim}}$|
|Country–capital|$\mathbf{v}_{\text{Paris}} - \mathbf{v}_{\text{France}} \approx \mathbf{v}_{\text{Berlin}} - \mathbf{v}_{\text{Germany}} \approx \mathbf{v}_{\text{Rome}} - \mathbf{v}_{\text{Italy}}$|
|Comparatives|$\mathbf{v}_{\text{bigger}} - \mathbf{v}_{\text{big}} \approx \mathbf{v}_{\text{taller}} - \mathbf{v}_{\text{tall}} \approx \mathbf{v}_{\text{faster}} - \mathbf{v}_{\text{fast}}$|

These patterns are more convincing because they appear across many examples, not just one. When the same offset works repeatedly, it suggests that the model has captured a real structure in language rather than a coincidence.

This structure is what makes embeddings useful. They do more than store words: they capture relationships between them. For example, if a model learns several country–capital pairs, it effectively learns the idea of a "capital city" as a vector shift that can be reused across different countries.

Two qualifications constrain how far this picture extends. First, the linearity is approximate: offsets are consistent in direction but not magnitude, and the analogy method degrades for relation types that are sparse in the training corpus or that require compositional rather than associative reasoning. Second, this analysis applies to _static_ embedding spaces. In transformer-based models, token representations are dynamically contextualized at every layer — the same word occupies different positions in representational space depending on its context. The clean geometric picture described here does not straightforwardly transfer to those settings.

## What We Are Really Trying to Do

A word is a symbol. Behind it sits a concept — a thought, a feeling, a texture of meaning — that exists in the mind before language does. When we speak or write, we reach into a shared vocabulary and try to compress that concept into symbols, hoping it reassembles correctly in someone else's mind.

There is a useful analogy here, not a precise biological claim, but an intuition worth holding. When you encounter a concept — "coffee," "loss," "home" — something happens in the brain that is not a single neuron firing but a _combination_: a pattern spread across many neurons, each partially active, whose collective state encodes the meaning. Change the context and the pattern shifts. "Bank" beside "river" and "bank" beside "investment" are the same symbol but, in some sense, a different mental event. Meaning lives not in the symbol but in the pattern it evokes.

A word vector borrows this structure. Instead of neurons, dimensions. Instead of activation levels, real-valued coordinates. A dense vector $\mathbf{v} \in \mathbb{R}^d$ is a pattern across $d$ numbers — some large, some small, some negative — whose combination encodes a concept in a way that no single number could.

2D Projection — Learned Embedding Space (hover to inspect)

Words are colour-coded by semantic group. Similar words cluster together.

Word2Vec was a first attempt to learn these patterns from data. It worked surprisingly well, but with one fundamental limitation: each word received a single fixed vector regardless of context. "Bank" always activated the same combination of dimensions, whether the sentence was about rivers or money.

What we actually want is a representation that shifts with context — the same symbol producing a different pattern depending on what surrounds it. Building that is the problem we turn to next.

**Relaxing orthogonality increases capacity.**

To see the effect concretely, consider an embedding space of dimension $n=1000$. If we require vectors to be exactly orthogonal, then at most 1000 independent directions can exist. Now relax this constraint slightly and allow vectors to be nearly orthogonal, meaning their pairwise inner products satisfy

$$|\langle v_i, v_j \rangle| \le \varepsilon.$$

High-dimensional geometry shows that the number of such vectors scales roughly as

$$M \approx 2^{\,\Theta(\varepsilon^2 n)}.$$

For example, if we allow a moderate deviation from orthogonality corresponding to angles of about $85^\circ$ (so $\varepsilon \approx 0.087$), then $\varepsilon^2 n \approx 7.5$. This implies that the number of nearly independent directions can be on the order of

$$M \sim 2^{7.5} \approx 180$$

times larger than the strictly orthogonal limit. Instead of only 1000 independent directions, the space may support on the order of hundreds of thousands of approximately independent ones. As the dimension increases further, this growth becomes extremely rapid.

The implication for word vectors is important: embedding spaces do not need one dimension per concept. By tolerating small overlap between directions, a moderate-dimensional space can represent vastly more words or semantic features than its raw dimensionality would suggest, while still keeping them geometrically distinguishable.

## From Words to Tokens

So far, we have treated words as the basic units of language. This was sufficient for models such as Word2Vec and GloVe, which assign a single vector to each word in a fixed vocabulary.

However, this choice has clear limitations. Natural language is productive: new words appear constantly, and many words are rare. Treating each word as an atomic unit forces the model to either ignore unseen words or map them to a generic unknown symbol.

Subword tokenization addresses this by reusing frequent pieces — common roots, prefixes, and suffixes — across many words. This dramatically lowers the risk of out-of-vocabulary failures, because even unfamiliar words can be constructed from familiar token fragments.

Modern models relax this assumption by operating not on whole words, but on **tokens**.

A token is a unit of text chosen by the model. It may correspond to: a full word ("image"), part of a word ("retriev", "er"), or even punctuation.

For example, for an image-generation prompt like _A photorealistic image of a golden retriever wearing sunglasses._, the token sequence may look like

$$\text{A},\ \text{photo},\ \text{real},\ \text{istic},\ \text{image},\ \text{of},\ \text{a},\ \text{golden},\ \text{retriev},\ \text{er},\ \text{wear},\ \text{ing},\ \text{sunglass},\ \text{es},\ \text{.}).$$

**Definition: Token.** A **token** is a discrete unit of text used as input to a language model. It may correspond to a full word, a subword fragment, or a punctuation symbol.

The set of all possible tokens is called the **vocabulary**, denoted $\mathcal{V}$. In modern architectures, text is therefore modeled as a sequence of tokens:

$$(y_1, y_2, \ldots, y_N), \quad y_i \in \mathcal{V}.$$

This shift from words to tokens allows models to handle rare and unseen words, share structure across related forms, and scale more effectively to open-ended language.

In practice, we no longer construct word vectors using skip-gram, CBOW, GloVe, or any explicit co-occurrence objective. We initialize $E$ randomly and let the model learn it end-to-end — gradient descent discovers the same structure implicitly, as a byproduct of learning to do something harder. What these methods gave us is not a recipe but an understanding: dense vectors can encode meaning, and context is how meaning is learned.