# 2022-women-career-mobility

# Research Question
The Effect of significant life events, e.g., marriage, birth of children, migration, etc, on women's career levels, measured by income quantile. Make comparison with men.

# Data Source
National Longitudinal Surveys

# Research Methods
1. Descriptive statistics
2. Multinominal logistic regression
3. Clustering (KNN)
4. Visualization 

# Output
1. An interactive visual system **Work-Life Visualization(WLViz)**. Demo video of the system see: [https://youtu.be/pJEG_RyMWJ4](https://youtu.be/pJEG_RyMWJ4)
2. A paper: *Towards Better Understanding of the Work–Life Dynamics* (not publish yet)

# Findings
Based on the descriptive and regression analysis of the data, we discovered:

1. The rate of women having children is higher than men.
2. Women's income quantile distribution is noticeably lower than men's, and this distribution is not alleviated throughout their career life.
3. Among the frequent career sequence patterns, there is a type of career path for women that goes from a high quantile to a low one (constantly decreasing), which is very inconsistent with the usual logic of career development. However, this did not happen in the more frequent careers for men.
4. Women's career paths typically involve small increases (from level 3 to level 4) if ascending, or consistent declines (from level 4 to 3 to 2 to 1) if descending.

5. The varying impacts of marriage on men and women:
- Women:
  - Most women choose to marry at a conventional time.
  - As marital status stabilizes, husbands or family support likely continues to exist.
  - Women at Level 5 are less inclined to quit or downgrade in their jobs (Matthew effect? Or is the cost of quitting too high?).
  - Unmarried women struggle more persistently against declining levels.
  - Marriage assists in upward mobility and becomes increasingly achievable.
  - In the later stages of marriage, such as stage 7, marriage plays a negative role, making it easier for women to fall from middle-low income to low (perhaps middle-low income jobs are more prone to unemployment with age?).
- Men:
  - High-income men find partners more easily.
  - Men face fewer obstacles in income mobility compared to women.
  - Marriage in the mid-term aids men in reaching higher levels.

6. The differing impacts of having children on men and women:

- Women:
  - High-income women generally choose not to have children too early (stage 2, 3).
  - Raising children has a significant negative impact on women who are just entering their careers.
  - Compared to early career stages 2-3, having children in stage 4 may not lead directly to low income, but rather a "down then up" pattern, which seems more acceptable to some extent?
- Men:
  - The higher the income, the earlier the marriage, and consequently the earlier the children.
  - A man's career path seems to have less correlation with whether or not he has children.


# Code
See code file

# Ideas
- Goal:
Investigate the effect of life choices, i.e., whether to enter significant life events, mainly marriage and giving birth to children, on women's career path.

- Questions:
  - Long-Lasting Impact: How many steps of influences should we consider since an event might have a long-lasting effect?
  - Event Handling: How do we consider the effects of different events? Should we consider them separately or cumulatively?
  - Yearly Variance: The effect could vary year to year. We were torn between considering each year's effect, leading to many outcomes and difficulty in drawing conclusions, or averaging the effects, and if so, averaging over what timeframe?
- Our Plan and Solutions:
  - Data Windowing: Decided on a 5-year window to cut the longitudinal data into several manageable segments.
  - One-Step Influence: We considered one-step influence, meaning that life events happening in a specific window would only have effects on the next window. This simplified the long-term analysis.
  - Income Clustering: We performed clustering on the income quintile sequence, labeling different sequences into five clusters. These labels became our response variable.
      - Challenge: To make sense of the regression, clusters need to be interpreted and ranked, ambiguity happens here
      - Solution: We succeeded in interpreting and ranking them, though some ambiguity remained.
  - Cumulative Effects: We treated different types of life events occurring within one window as equal/identical units, analyzing their cumulative effects.
    - Potential Problem: This approach might be oversimplified, as we didn't consider the effects of the events that happened in the response window itself.
