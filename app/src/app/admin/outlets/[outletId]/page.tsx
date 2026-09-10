"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./outlet.module.css";

interface Section {
  id: string;
  name: string;
  displayOrder: number;
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  imagePath: string | null;
  active: boolean;
  displayOrder: number;
}

interface Outlet {
  id: string;
  name: string;
  slug: string;
  sections: Section[];
  property: {
    name: string;
  };
}

export default function OutletPage() {
  const params = useParams();
  const router = useRouter();
  const outletId = params.outletId as string;

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: "",
    description: "",
    price: "",
    imagePath: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editItemData, setEditItemData] = useState({
    name: "",
    description: "",
    price: "",
    imagePath: "",
  });
  const [editImagePreview, setEditImagePreview] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    const fetchOutlet = async () => {
      try {
        const res = await fetch(`/api/admin/outlets/${outletId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch outlet");
        }

        const data = await res.json();
        setOutlet(data.outlet);
      } catch (err) {
        setError("Failed to load outlet");
      } finally {
        setLoading(false);
      }
    };

    fetchOutlet();
  }, [outletId, router]);

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/outlets/${outletId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSectionName }),
      });

      if (!res.ok) throw new Error("Failed to add section");

      const data = await res.json();
      setOutlet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: [...prev.sections, data.section],
        };
      });

      setNewSectionName("");
      setShowNewSectionForm(false);
    } catch (err) {
      alert("Failed to add section");
    }
  };

  const handleAddCategory = async () => {
    if (!selectedSection || !newCategoryName.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `/api/admin/outlets/${outletId}/sections/${selectedSection}/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newCategoryName }),
        }
      );

      if (!res.ok) throw new Error("Failed to add category");

      const data = await res.json();
      setOutlet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === selectedSection
              ? { ...s, categories: [...s.categories, data.category] }
              : s
          ),
        };
      });

      setNewCategoryName("");
      setShowNewCategoryForm(false);
    } catch (err) {
      alert("Failed to add category");
    }
  };

  const handleImageUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setNewItemData({
          ...newItemData,
          imagePath: data.imagePath,
        });
      } else {
        alert("Image upload failed");
        setImagePreview("");
      }
    } catch (err) {
      alert("Image upload failed");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleEditItem = (item: Item, section: any) => {
    setEditingItem(item);
    const imagePath = typeof item.imagePath === 'string' ? item.imagePath : '';
    setEditItemData({
      name: item.name,
      description: item.description || "",
      price: String(typeof item.price === 'string' ? item.price : item.price.toString()),
      imagePath: imagePath,
    });
    if (imagePath) {
      setEditImagePreview(imagePath);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const section = outlet?.sections.find((s) =>
      s.categories.some((c) => c.id === selectedCategory)
    );

    if (!section) return;

    try {
      const res = await fetch(
        `/api/admin/outlets/${outletId}/sections/${section.id}/categories/${selectedCategory}/items/${editingItem.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editItemData.name,
            description: editItemData.description,
            price: editItemData.price,
            imagePath: editItemData.imagePath,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save item");

      const data = await res.json();
      setOutlet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id
              ? {
                  ...s,
                  categories: s.categories.map((c) =>
                    c.id === selectedCategory
                      ? {
                          ...c,
                          items: c.items.map((i) =>
                            i.id === editingItem.id ? data.item : i
                          ),
                        }
                      : c
                  ),
                }
              : s
          ),
        };
      });

      setEditingItem(null);
      setEditImagePreview("");
    } catch (err) {
      alert("Failed to save item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Delete this item?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const section = outlet?.sections.find((s) =>
      s.categories.some((c) => c.id === selectedCategory)
    );

    if (!section) return;

    try {
      const res = await fetch(
        `/api/admin/outlets/${outletId}/sections/${section.id}/categories/${selectedCategory}/items/${itemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete item");

      setOutlet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id
              ? {
                  ...s,
                  categories: s.categories.map((c) =>
                    c.id === selectedCategory
                      ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
                      : c
                  ),
                }
              : s
          ),
        };
      });
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  const handleAddItem = async () => {
    if (!selectedCategory || !newItemData.name.trim() || !newItemData.price) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    const section = outlet?.sections.find((s) =>
      s.categories.some((c) => c.id === selectedCategory)
    );

    if (!section) return;

    try {
      const res = await fetch(
        `/api/admin/outlets/${outletId}/sections/${section.id}/categories/${selectedCategory}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newItemData.name,
            description: newItemData.description,
            price: newItemData.price,
            imagePath: newItemData.imagePath,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to add item");

      const data = await res.json();
      setOutlet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id
              ? {
                  ...s,
                  categories: s.categories.map((c) =>
                    c.id === selectedCategory
                      ? { ...c, items: [...c.items, data.item] }
                      : c
                  ),
                }
              : s
          ),
        };
      });

      setNewItemData({ name: "", description: "", price: "", imagePath: "" });
      setImagePreview("");
      setShowNewItemForm(false);
    } catch (err) {
      alert("Failed to add item");
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error || !outlet) {
    return <div className={styles.container}>{error || "Outlet not found"}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <button onClick={() => router.back()} className={styles.backBtn}>
            ← Back
          </button>
          <h1>{outlet.name}</h1>
          <p className={styles.property}>{outlet.property.name}</p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          {/* Sections */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Sections</h2>
              <button
                onClick={() => setShowNewSectionForm(!showNewSectionForm)}
                className={styles.addBtn}
              >
                + Add Section
              </button>
            </div>

            {showNewSectionForm && (
              <div className={styles.form}>
                <input
                  type="text"
                  placeholder="Section name (e.g., Food, Beverage)"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
                <div className={styles.formButtons}>
                  <button onClick={handleAddSection}>Create</button>
                  <button
                    onClick={() => {
                      setShowNewSectionForm(false);
                      setNewSectionName("");
                    }}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className={styles.list}>
              {outlet.sections.map((section) => (
                <div
                  key={section.id}
                  className={`${styles.item} ${
                    selectedSection === section.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div>
                    <strong>{section.name}</strong>
                    <p>{section.categories.length} categories</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Categories */}
          {selectedSection && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Categories</h2>
                <button
                  onClick={() =>
                    setShowNewCategoryForm(!showNewCategoryForm)
                  }
                  className={styles.addBtn}
                >
                  + Add Category
                </button>
              </div>

              {showNewCategoryForm && (
                <div className={styles.form}>
                  <input
                    type="text"
                    placeholder="Category name (e.g., Main Course)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <div className={styles.formButtons}>
                    <button onClick={handleAddCategory}>Create</button>
                    <button
                      onClick={() => {
                        setShowNewCategoryForm(false);
                        setNewCategoryName("");
                      }}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.list}>
                {outlet.sections
                  .find((s) => s.id === selectedSection)
                  ?.categories.map((category) => (
                    <div
                      key={category.id}
                      className={`${styles.item} ${
                        selectedCategory === category.id ? styles.selected : ""
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div>
                        <strong>{category.name}</strong>
                        <p>{category.items.length} items</p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Items */}
          {selectedCategory && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Items</h2>
                <button
                  onClick={() => setShowNewItemForm(!showNewItemForm)}
                  className={styles.addBtn}
                >
                  + Add Item
                </button>
              </div>

              {showNewItemForm && (
                <div className={styles.form}>
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemData.name}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newItemData.description}
                    onChange={(e) =>
                      setNewItemData({
                        ...newItemData,
                        description: e.target.value,
                      })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    value={newItemData.price}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, price: e.target.value })
                    }
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={uploading}
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                          marginTop: "10px",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.formButtons}>
                    <button onClick={handleAddItem}>Create</button>
                    <button
                      onClick={() => {
                        setShowNewItemForm(false);
                        setNewItemData({ name: "", description: "", price: "", imagePath: "" });
                        setImagePreview("");
                      }}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {editingItem && (
                <div className={styles.modal}>
                  <div className={styles.modalContent}>
                    <div className={styles.modalHeader}>
                      <h2>Edit Item</h2>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setEditImagePreview("");
                        }}
                        className={styles.closeBtn}
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Item name"
                      value={editItemData.name}
                      onChange={(e) =>
                        setEditItemData({ ...editItemData, name: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={editItemData.description}
                      onChange={(e) =>
                        setEditItemData({
                          ...editItemData,
                          description: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      step="0.01"
                      value={editItemData.price}
                      onChange={(e) =>
                        setEditItemData({ ...editItemData, price: e.target.value })
                      }
                    />
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const preview = URL.createObjectURL(file);
                          setEditImagePreview(preview);

                          const formData = new FormData();
                          formData.append("file", file);

                          try {
                            const token = localStorage.getItem("token");
                            const res = await fetch("/api/admin/uploads", {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                              body: formData,
                            });

                            if (res.ok) {
                              const data = await res.json();
                              setEditItemData({
                                ...editItemData,
                                imagePath: data.imagePath,
                              });
                            }
                          } catch (err) {
                            alert("Image upload failed");
                          }
                        }}
                      />
                      {editImagePreview && (
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                            marginTop: "10px",
                            borderRadius: "4px",
                          }}
                        />
                      )}
                    </div>
                    <div className={styles.modalButtons}>
                      <button onClick={handleSaveEdit}>Save</button>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setEditImagePreview("");
                        }}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.items}>
                {outlet.sections
                  .find((s) => s.id === selectedSection)
                  ?.categories.find((c) => c.id === selectedCategory)
                  ?.items.map((item) => (
                    <div key={item.id} className={styles.itemCard}>
                      {item.imagePath && (
                        <img
                          src={item.imagePath}
                          alt={item.name}
                          className={styles.itemImage}
                        />
                      )}
                      <div className={styles.itemContent}>
                        <div>
                          <h3>{item.name}</h3>
                          {item.description && (
                            <p className={styles.description}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className={styles.itemPrice}>
                          ${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button className={styles.editBtn} onClick={() => handleEditItem(item, outlet.sections.find((s) => s.id === selectedSection))}>✎</button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteItem(item.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
