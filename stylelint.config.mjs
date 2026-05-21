export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-no-hex': [
      true,
      {
        message: 'Use a CSS variable from tokens.css (var(--*)) instead of a hex literal.',
      },
    ],
    'color-named': 'never',
    // Disabled — false positives on perfectly valid kebab-case tokens like --bg, --ink-2.
    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'declaration-empty-line-before': null,
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'no-duplicate-selectors': null,
    'media-feature-range-notation': null,
    'custom-property-empty-line-before': null,
    'value-keyword-case': null,
    'shorthand-property-no-redundant-values': null,
    'selector-not-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'property-no-vendor-prefix': null,
  },
  overrides: [
    {
      files: ['src/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
      },
    },
  ],
};
