import React, { useState, useMemo } from 'react'
import styles from '../styles/pattern-template-selector.module.css'
import { getPatternTemplatesByCategory } from '../lib/regexPatterns'

export default function PatternTemplateSelector({ onSelectTemplate, selectedTemplateId }) {
  const [expandedCategory, setExpandedCategory] = useState('Common');
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getPatternTemplatesByCategory();
  const categoryList = Object.keys(categories).sort((a, b) => {
    const order = ['Common', 'Identifiers', 'Network', 'Colors', 'Business', 'Text', 'Web', 'Social', 'Payment', 'Location'];
    return (order.indexOf(a) !== -1 ? order.indexOf(a) : 999) - (order.indexOf(b) !== -1 ? order.indexOf(b) : 999);
  });

  // Filter templates based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(categories).forEach(([category, templates]) => {
      const matchedTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.pattern.toLowerCase().includes(query)
      );

      if (matchedTemplates.length > 0) {
        filtered[category] = matchedTemplates;
      }
    });

    return filtered;
  }, [categories, searchQuery]);

  const displayCategories = searchQuery.trim() ? filteredCategories : categories;
  const displayCategoryList = Object.keys(displayCategories).sort((a, b) => {
    const order = ['Common', 'Identifiers', 'Network', 'Colors', 'Business', 'Text', 'Web', 'Social', 'Payment', 'Location'];
    return (order.indexOf(a) !== -1 ? order.indexOf(a) : 999) - (order.indexOf(b) !== -1 ? order.indexOf(b) : 999);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>✨ Pattern Templates</h3>
        <p className={styles.subtitle}>Click to auto-fill regex pattern</p>
      </div>

      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className={styles.categoriesContainer}>
        {displayCategoryList.length === 0 ? (
          <div className={styles.noResults}>
            <p>No templates match your search</p>
          </div>
        ) : (
          displayCategoryList.map(category => (
            <div key={category} className={styles.categoryGroup}>
              <button
                className={`${styles.categoryHeader} ${expandedCategory === category ? styles.categoryExpanded : ''}`}
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              >
                <span className={styles.categoryIcon}>
                  {expandedCategory === category ? '▼' : '▶'}
                </span>
                <span className={styles.categoryName}>{category}</span>
                <span className={styles.templateCount}>{displayCategories[category].length}</span>
              </button>

              {expandedCategory === category && (
                <div className={styles.templatesGrid}>
                  {displayCategories[category].map(template => (
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
          ))
        )}
      </div>
    </div>
  );
}
