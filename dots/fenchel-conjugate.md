---
layout: page
title: "Fenchel Conjugate"
permalink: /dots/fenchel-conjugate/
---

# Fenchel Conjugate

The Fenchel conjugate of a function is

$$
f^*(y)=\sup_x \{\langle x,y\rangle-f(x)\}
$$

  

Before duality feels natural, we need one key idea:

  

> How do we rewrite a function in terms of its supporting linear functions?

  

The **Fenchel conjugate** is the answer.

---

## **Intuition First**

  

A convex function can be thought of as the **upper envelope of all affine lines touching it from below**.

  

Instead of describing the function by its values at points,

  

$$

f(x)

$$

  

we describe it by:

  

> the steepest linear functions that can support it.

  

The conjugate stores the **best linear support value for every slope**.

---

## **Definition**

  

For a function $f: \mathbb{R}^n \to \mathbb{R} \cup {+\infty}$, its Fenchel conjugate is

  

$$

f^*(y)=\sup_x \left(y^\top x-f(x)\right)

$$

  

This asks:

  

> for a fixed slope vector $y$, what is the largest value of the linear score minus the function value?

  

Geometrically, this moves us from **point-space** into **slope-space**.

---

## **Geometric Meaning**

  

The term

  

$$

y^\top x-f(x)

$$

  

measures how well a linear function with slope $y$ fits the function at point $x$.

  

Taking the supremum over all $x$ means:

  

> choose the point where this slope fits best.

  

So the conjugate records the **best affine approximation for every slope**.

---

## **Simplest Example**

  

Take

  

$$

f(x)=\frac{1}{2}x^2

$$

  

Then

  

$$

f^*(y)=\sup_x \left(yx-\frac{1}{2}x^2\right)

$$

  

Differentiate the inside:

  

$$

y-x=0

$$

  

So

  

$$

x=y

$$

  

Substitute back:

  

$$

f^*(y)=\frac{1}{2}y^2

$$

  

So the quadratic is **self-conjugate**.

---

## **Fenchel–Young Inequality**

  

From the definition we immediately get

  

$$

y^\top x \le f(x)+f^*(y)

$$

  

This is the **Fenchel–Young inequality**.

  

It says:

  

> every bilinear interaction can be upper bounded by a primal term plus a dual term.

  

This is the seed of convex duality.

---

## **Why This Matters for Optimization**

  

Suppose the primal problem is

  

$$

\min_x f(x)+g(Ax)

$$

  

The conjugate lets us rewrite this in dual variables involving

  

$$
f^*(\cdot), \quad g^*(\cdot)
$$

  

So the conjugate turns

  

> optimization over points

  

into

  

> optimization over slopes, constraints, and certificates.

---

## **Deep Intuition**

  

The primal function answers:

  

> what is the cost at a point?

  

The conjugate answers:

  

> what is the cost of enforcing a slope?

  

So Fenchel conjugation is really a **change of coordinates from position-space to slope-space**.

---

## **Biconjugate**

  

Apply the conjugate twice:

  

$$

f^{**}(x)

$$

  

For closed convex functions,

  

$$

f^{**}(x)=f(x)

$$

  

This is the **Fenchel–Moreau theorem**.

  

Meaning:

  

> convex functions are completely recoverable from their supporting hyperplanes.

---

## **Mental Model**

  

Whenever you see

  

$$

\sup_x \left(y^\top x-f(x)\right)

$$

  

read it as:

  

> for this slope, what is the tightest supporting plane?


https://www.stat.cmu.edu/~siva/teaching/725/lec12.pdf

<iframe
  src="https://www.desmos.com/calculator/ihjlyro7rx"
  width="100%"
  height="400"
  style="border:none; border-radius:12px;">
</iframe>
