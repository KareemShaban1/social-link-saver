import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, GripVertical, ArrowRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
}

interface CategoryHierarchyEditorProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onUpdate: () => void;
}

export const CategoryHierarchyEditor = ({ 
  categories, 
  onEdit, 
  onDelete,
  onUpdate 
}: CategoryHierarchyEditorProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const convertToParent = async (category: Category) => {
    try {
      await api.updateCategory(category.id, {
        parentId: undefined,
      });

      toast({
        title: "Success",
        description: `"${category.name}" is now a parent category`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to convert to parent category",
        variant: "destructive",
      });
    }
  };

  const convertToSubcategory = async (category: Category, newParentId: string) => {
    // Check if this would create circular reference
    const subcats = getSubcategories(category.id);
    if (subcats.length > 0) {
      toast({
        title: "Cannot convert",
        description: "Remove subcategories first before converting to subcategory",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.updateCategory(category.id, {
        parentId: newParentId,
      });

      toast({
        title: "Success",
        description: `"${category.name}" is now a subcategory`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to convert to subcategory",
        variant: "destructive",
      });
    }
  };

  const moveSubcategory = async (subcategory: Category, newParentId: string) => {
    try {
      await api.updateCategory(subcategory.id, {
        parentId: newParentId,
      });

      const newParent = categories.find(c => c.id === newParentId);
      toast({
        title: "Success",
        description: `"${subcategory.name}" moved to "${newParent?.name}"`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to move subcategory",
        variant: "destructive",
      });
    }
  };

  return (
	  <div className="space-y-4">
      {parentCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No categories yet. Create your first category!
        </p>
      ) : (
				  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {parentCategories.map((parent) => {
            const subcategories = getSubcategories(parent.id);
            const isExpanded = expandedCategories.has(parent.id);

            return (
		  <div key={parent.id} className="flex flex-col h-full">
			  {/* Parent Category Column */}
			  <div className="flex flex-col border rounded-lg bg-card hover:shadow-md transition-all h-full">
				  {/* Parent Category Header */}
				  <div className="group flex flex-col gap-2 p-4 border-b">
					  <div className="flex items-center gap-2">
						  <button
							  onClick={() => toggleExpand(parent.id)}
							  className="p-1 hover:bg-muted rounded transition-colors shrink-0"
							  disabled={subcategories.length === 0}
						  >
							  {subcategories.length > 0 ? (
								  isExpanded ? (
									  <ChevronDown className="h-4 w-4" />
								  ) : (
									  <ChevronRight className="h-4 w-4" />
								  )
							  ) : (
								  <div className="w-4 h-4" />
							  )}
						  </button>

						  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

						  <div
							  className="w-6 h-6 rounded shrink-0"
							  style={{ backgroundColor: parent.color }}
						  />

						  <span className="font-medium flex-1 truncate">{parent.name}</span>

						  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
							  <Button
								  variant="ghost"
								  size="icon"
								  onClick={() => onEdit(parent)}
								  className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
							  >
								  <Pencil className="h-4 w-4" />
							  </Button>
							  <Button
								  variant="ghost"
								  size="icon"
								  onClick={() => onDelete(parent)}
								  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
							  >
								  <Trash2 className="h-4 w-4" />
							  </Button>
						  </div>
					  </div>

					  {subcategories.length > 0 && (
						  <div className="flex items-center justify-between">
							  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
								  {subcategories.length} {subcategories.length === 1 ? 'subcategory' : 'subcategories'}
							  </span>
						  </div>
					  )}
				  </div>

				  {/* Subcategories List */}
				  {isExpanded && subcategories.length > 0 && (
					  <div className="flex-1 p-2 space-y-1 overflow-y-auto max-h-[400px]">
						  {subcategories.map((subcat) => (
							  <div
								  key={subcat.id}
				  className="group flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:shadow-sm transition-all"
			  >
				  <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />

				  <div
					  className="w-4 h-4 rounded shrink-0"
					  style={{ backgroundColor: subcat.color }}
				  />

				  <span className="text-sm font-medium flex-1 truncate">{subcat.name}</span>

				  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
					  {/* Move to another parent */}
					  {parentCategories.filter(p => p.id !== parent.id).length > 0 && (
						  <div className="relative group/move">
							  <Button
								  variant="ghost"
								  size="icon"
								  className="h-7 w-7 hover:bg-accent/10 hover:text-accent"
								  title="Move to another parent"
							  >
								  <ArrowRight className="h-3 w-3" />
							  </Button>
							  <div className="absolute right-0 top-full mt-1 hidden group-hover/move:block z-50">
								  <div className="bg-popover border rounded-lg shadow-lg p-2 min-w-[160px]">
									  <p className="text-xs text-muted-foreground mb-2 px-2">Move to:</p>
									  {parentCategories
										  .filter(p => p.id !== parent.id)
										  .map((targetParent) => (
											  <button
												  key={targetParent.id}
												  onClick={() => moveSubcategory(subcat, targetParent.id)}
												  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded flex items-center gap-2"
											  >
												  <div
													  className="w-4 h-4 rounded shrink-0"
													  style={{ backgroundColor: targetParent.color }}
												  />
												  {targetParent.name}
											  </button>
										  ))}
								  </div>
							  </div>
						  </div>
					  )}

					  {/* Convert to parent */}
					  <Button
						  variant="ghost"
						  size="icon"
						  onClick={() => convertToParent(subcat)}
						  className="h-7 w-7 hover:bg-accent/10 hover:text-accent"
						  title="Convert to parent category"
					  >
						  <ArrowLeft className="h-3 w-3" />
					  </Button>

					  <Button
						  variant="ghost"
						  size="icon"
						  onClick={() => onEdit(subcat)}
						  className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
					  >
						  <Pencil className="h-3 w-3" />
					  </Button>
					  <Button
						  variant="ghost"
						  size="icon"
						  onClick={() => onDelete(subcat)}
						  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
					  >
						  <Trash2 className="h-3 w-3" />
					  </Button>
				  </div>
			  </div>
		  ))}
					  </div>
				  )}

				  {/* Empty state for column */}
				  {!isExpanded && subcategories.length === 0 && (
					  <div className="flex-1 p-4 text-center text-xs text-muted-foreground">
						  No subcategories
					  </div>
				  )}
			  </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Bulk Actions Section */}
      {parentCategories.length > 0 && (
        <div className="mt-6 p-4 border-t">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Bulk Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories(new Set(parentCategories.map(c => c.id)))}
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories(new Set())}
            >
              Collapse All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
