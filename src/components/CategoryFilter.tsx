import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) => {
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={selectedCategory === null ? "bg-primary" : ""}
      >
        {selectedCategory === null && <Check className="h-3 w-3 mr-1" />}
        All
      </Button>
      {parentCategories.map((category) => {
        const subcategories = getSubcategories(category.id);
        return (
          <div key={category.id} className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(category.id)}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : undefined,
                borderColor: category.color,
                color: selectedCategory === category.id ? "#fff" : category.color,
              }}
            >
              {selectedCategory === category.id && <Check className="h-3 w-3 mr-1" />}
              {category.name}
            </Button>
            {subcategories.map((subcat) => (
              <Button
                key={subcat.id}
                variant={selectedCategory === subcat.id ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectCategory(subcat.id)}
                className="ml-1"
                style={{
                  backgroundColor: selectedCategory === subcat.id ? subcat.color : undefined,
                  borderColor: subcat.color,
                  color: selectedCategory === subcat.id ? "#fff" : subcat.color,
                }}
              >
                {selectedCategory === subcat.id && <Check className="h-3 w-3 mr-1" />}
                └─ {subcat.name}
              </Button>
            ))}
          </div>
        );
      })}
    </div>
  );
};
