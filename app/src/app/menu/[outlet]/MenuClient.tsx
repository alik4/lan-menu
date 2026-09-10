"use client";

import { useState } from "react";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imagePath: string | null;
};

type Category = {
  id: string;
  name: string;
  items: Item[];
};

type Section = {
  id: string;
  name: string;
  categories: Category[];
};

type Outlet = {
  id: string;
  name: string;
  property: { name: string };
  sections: Section[];
};

const VIEW_ALL = "__view_all__";

export default function MenuClient({ outlet }: { outlet: Outlet }) {
  const [activeSectionId, setActiveSectionId] = useState(outlet.sections[0]?.id ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState(VIEW_ALL);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const activeSection = outlet.sections.find((s) => s.id === activeSectionId);

  const itemsToShow: (Item & { categoryName: string })[] =
    activeSection?.categories.flatMap((cat) =>
      (activeCategoryId === VIEW_ALL || activeCategoryId === cat.id)
        ? cat.items.map((item) => ({ ...item, categoryName: cat.name }))
        : []
    ) ?? [];

  function selectSection(id: string) {
    setActiveSectionId(id);
    setActiveCategoryId(VIEW_ALL);
  }

  return (
    <main className="menu-page">
      <header className="menu-header">
        <p className="property-name">{outlet.property.name}</p>
        <h1>{outlet.name}</h1>
      </header>

      <nav className="section-tabs">
        {outlet.sections.map((section) => (
          <button
            key={section.id}
            className={section.id === activeSectionId ? "tab active" : "tab"}
            onClick={() => selectSection(section.id)}
          >
            {section.name}
          </button>
        ))}
      </nav>

      {activeSection && (
        <nav className="category-tabs">
          <button
            className={activeCategoryId === VIEW_ALL ? "subtab active" : "subtab"}
            onClick={() => setActiveCategoryId(VIEW_ALL)}
          >
            View all
          </button>
          {activeSection.categories.map((cat) => (
            <button
              key={cat.id}
              className={activeCategoryId === cat.id ? "subtab active" : "subtab"}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      )}

      <section className="item-grid">
        {itemsToShow.length === 0 && <p className="empty-state">No items in this category yet.</p>}
        {itemsToShow.map((item) => (
          <article 
            key={item.id} 
            className="item-card"
            onClick={() => setSelectedItem(item)}
            style={{ cursor: "pointer" }}
          >
            {item.imagePath && (
              <img src={item.imagePath} alt={item.name} className="item-image" />
            )}
            <div className="item-body">
              <div className="item-title-row">
                <h3>{item.name}</h3>
                <span className="item-price">${item.price.toFixed(2)}</span>
              </div>
              {item.description && <p className="item-description">{item.description}</p>}
            </div>
          </article>
        ))}
      </section>

      {selectedItem && (
        <div className="item-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="item-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="item-modal-close"
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </button>
            {selectedItem.imagePath && (
              <img 
                src={selectedItem.imagePath} 
                alt={selectedItem.name} 
                className="item-modal-image" 
              />
            )}
            <div className="item-modal-body">
              <h2>{selectedItem.name}</h2>
              {selectedItem.description && (
                <p className="item-modal-description">{selectedItem.description}</p>
              )}
              <div className="item-modal-price">
                ${selectedItem.price.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
