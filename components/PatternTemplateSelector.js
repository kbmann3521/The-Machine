import React, { useState } from 'react'
import styles from '../styles/pattern-template-selector.module.css'
import { getPatternTemplatesByCategory } from '../lib/regexPatterns'

export default function PatternTemplateSelector({ onSelectTemplate, selectedTemplateId }) {
  const [expandedCategory, setExpandedCategory] = useState('Common');
  const categories = getPatternTemplatesByCategory();
  const categoryList = Object.keys(categories).sort((a, b) => {
    const order = ['Common', 'Identifiers', 'Network', 'Colors', 'Business', 'Text', 'Web', 'Social', 'Payment', 'Location'];
    return (order.indexOf(a) !== -1 ? order.indexOf(a) : 999) - (order.indexOf(b) !== -1 ? order.indexOf(b) : 999);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>✨ Pattern Templates</h3>
        <p className={styles.subtitle}>Click to auto-fill regex pattern</p>
      </div>

      <div className={styles.categoriesContainer}>
        {categoryList.map(category => (
          <div key={category} className={styles.categoryGroup}>
            <button
              className={`${styles.categoryHeader} ${expandedCategory === category ? styles.categoryExpanded : ''}`}
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              <span className={styles.categoryIcon}>
                {expandedCategory === category ? '▼' : '▶'}
              </span>
              <span className={styles.categoryName}>{category}</span>
              <span className={styles.templateCount}>{categories[category].length}</span>
            </button>

            {expandedCategory === category && (
              <div className={styles.templatesGrid}>
                {categories[category].map(template => (
                  <button
                    key={template.id}
                    className={`${styles.templateButton} ${selectedTemplateId === template.id ? styles.templateSelected : ''}`}
                    onClick={() => onSelectTemplate(template)}
                    title={template.description}
                  >
                    <div className={styles.templateName}>{template.name}</div>
                    <div className={styles.templateDescription}>{template.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
