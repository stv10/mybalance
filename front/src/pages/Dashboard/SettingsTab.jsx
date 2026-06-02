import React from 'react';
import CategoryForm from '../../components/settings/CategoryForm';
import CategoryList from '../../components/settings/CategoryList';

/**
 * SettingsTab — vista de ajustes y gestión de categorías.
 */
const SettingsTab = ({ categories, onCreateCategory, onDeleteCategory }) => {
  return (
    <div className="settings-container animate-fade-in">
      <CategoryForm categories={categories} onCreate={onCreateCategory} />
      <CategoryList categories={categories} onDelete={onDeleteCategory} />
    </div>
  );
};

export default SettingsTab;
