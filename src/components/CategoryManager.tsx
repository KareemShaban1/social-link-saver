import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Pencil, Trash2, Palette, Network } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryHierarchyEditor } from "./CategoryHierarchyEditor";

interface Category {
	id: string;
	name: string;
	color: string;
	parent_id: string | null;
}

interface CategoryManagerProps {
	categories: Category[];
	onCategoriesChange: () => void;
}

const PRESET_COLORS = [
	"#ec4899", // Pink
	"#3b82f6", // Blue
	"#ef4444", // Red
	"#10b981", // Green
	"#f59e0b", // Amber
	"#8b5cf6", // Purple
	"#06b6d4", // Cyan
	"#f97316", // Orange
	"#14b8a6", // Teal
	"#a855f7", // Violet
];

export const CategoryManager = ({ categories, onCategoriesChange }: CategoryManagerProps) => {
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
	const [parentId, setParentId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const parentCategories = categories.filter(c => !c.parent_id);
	const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

	// All categories that can be a parent, in tree order (for dropdown). When editing, exclude self and descendants to avoid cycles.
	const getDescendantIds = (catId: string): string[] => {
		const direct = categories.filter(c => c.parent_id === catId).map(c => c.id);
		return [...direct, ...direct.flatMap(id => getDescendantIds(id))];
	};

	const getParentOptions = (): { id: string; label: string; depth: number }[] => {
		const excludeSet = editingCategory
			? new Set([editingCategory.id, ...getDescendantIds(editingCategory.id)])
			: new Set<string>();
		const result: { id: string; label: string; depth: number }[] = [];
		const add = (cat: Category, depth: number) => {
			if (excludeSet.has(cat.id)) return;
			result.push({ id: cat.id, label: cat.name, depth });
			getSubcategories(cat.id).forEach(sub => add(sub, depth + 1));
		};
		parentCategories.forEach(p => add(p, 0));
		return result;
	};

	const resetForm = () => {
		setNewName("");
		setNewColor(PRESET_COLORS[0]);
		setParentId(null);
		setEditingCategory(null);
	};

	const handleAdd = async () => {
		if (!newName.trim()) {
			toast({
				title: "Missing name",
				description: "Please enter a category name",
				variant: "destructive",
			});
			return;
		}

		if (!user) {
			toast({
				title: "Error",
				description: "You must be logged in to create categories",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);

		try {
			await api.createCategory({
				name: newName.trim(),
				color: newColor,
				parentId: parentId || undefined,
			});

			toast({
				title: "Success",
				description: "Category created successfully",
			});

			resetForm();
			onCategoriesChange();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message || "Failed to create category",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = async () => {
		if (!editingCategory || !newName.trim()) {
			toast({
				title: "Missing name",
				description: "Please enter a category name",
				variant: "destructive",
			});
			return;
		}

		setLoading(true);

		try {
			await api.updateCategory(editingCategory.id, {
				name: newName.trim(),
				color: newColor,
				parentId: parentId || undefined,
			});

			toast({
				title: "Success",
				description: "Category updated successfully",
			});

			resetForm();
			onCategoriesChange();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message || "Failed to update category",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteCategory) return;

		setLoading(true);

		try {
			await api.deleteCategory(deleteCategory.id);

			toast({
				title: "Success",
				description: "Category deleted successfully",
			});

			setDeleteCategory(null);
			onCategoriesChange();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message || "Failed to delete category",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const startEdit = (category: Category) => {
		setEditingCategory(category);
		setNewName(category.name);
		setNewColor(category.color);
		setParentId(category.parent_id);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) resetForm();
			}}>
				<DialogTrigger asChild>
					<Button variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
						<Settings className="mr-2 h-4 w-4" />
						Manage Categories
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Palette className="h-5 w-5" />
							Manage Categories
						</DialogTitle>
					</DialogHeader>

					<Tabs defaultValue="form" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="form" className="flex items-center gap-2">
								<Plus className="h-4 w-4" />
								Add/Edit
							</TabsTrigger>
							<TabsTrigger value="hierarchy" className="flex items-center gap-2">
								<Network className="h-4 w-4" />
								Hierarchy
							</TabsTrigger>
						</TabsList>

						<TabsContent value="form" className="space-y-4 mt-4">
							{/* Add/Edit Form */}
							<div className="border rounded-lg p-4 bg-muted/30 space-y-4">
								<h3 className="font-semibold text-sm">
									{editingCategory ? "Edit Category" : "Add New Category"}
								</h3>
								<div className="space-y-3">
									<div className="space-y-2">
										<Label htmlFor="category-name">Category Name</Label>
										<Input
											id="category-name"
											value={newName}
											onChange={(e) => setNewName(e.target.value)}
											placeholder="Enter category name"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="parent-category">Parent Category (Optional)</Label>
										<select
											id="parent-category"
											title="Select parent category"
											value={parentId || ""}
											onChange={(e) => setParentId(e.target.value || null)}
											className="w-full h-10 px-3 rounded-md border border-input bg-background"
										>
											<option value="">None (Top-level category)</option>
											{getParentOptions().map(({ id, label, depth }) => (
												<option key={id} value={id}>
													{depth === 0 ? label : "\u00A0\u00A0".repeat(depth) + "└─ " + label}
												</option>
											))}
										</select>
										<p className="text-xs text-muted-foreground">
											Choose a main category or a sub-category to nest under it.
										</p>
									</div>
									<div className="space-y-2">
										<Label>Color</Label>
										<div className="flex flex-wrap gap-2">
											{PRESET_COLORS.map((color) => (
												<button
													key={color}
													type="button"
													onClick={() => setNewColor(color)}
													className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${newColor === color ? "ring-2 ring-offset-2 ring-foreground" : ""
														}`}
													style={{ backgroundColor: color }}
													title={color}
												/>
											))}
											<div className="relative">
												<input
													type="color"
													value={newColor}
													onChange={(e) => setNewColor(e.target.value)}
													className="w-10 h-10 rounded-lg cursor-pointer"
													title="Custom color"
												/>
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										{editingCategory ? (
											<>
												<Button
													onClick={handleEdit}
													disabled={loading}
													className="flex-1 bg-primary hover:bg-primary/90"
												>
													Update Category
												</Button>
												<Button
													onClick={resetForm}
													variant="outline"
													disabled={loading}
												>
													Cancel
												</Button>
											</>
										) : (
											<Button
												onClick={handleAdd}
												disabled={loading}
												className="w-full bg-primary hover:bg-primary/90"
											>
												<Plus className="mr-2 h-4 w-4" />
												Add Category
											</Button>
										)}
									</div>
								</div>
							</div>

							{/* Categories List (recursive tree) */}
							<div className="space-y-2">
								<h3 className="font-semibold text-sm">Existing Categories</h3>
								{categories.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-8">
										No categories yet. Create your first category above!
									</p>
								) : (
									<div className="space-y-2">
										{parentCategories.map((category) => (
											<div key={category.id} className="space-y-2">
												{(() => {
													function renderCategoryTree(cat: Category, depth: number) {
														const isTop = depth === 0;
														const subcats = getSubcategories(cat.id);
														return (
															<>
																<div
																	key={cat.id}
																	className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${isTop ? "bg-card" : "bg-muted/30"}`}
																	style={depth > 0 ? { marginLeft: depth * 20 } : undefined}
																>
																	<div className="flex items-center gap-3">
																		<div
																			className={`rounded-lg shrink-0 ${isTop ? "w-8 h-8" : "w-6 h-6"}`}
																			style={{ backgroundColor: cat.color }}
																		/>
																		<span className={isTop ? "font-medium" : "font-medium text-sm"}>{cat.name}</span>
																	</div>
																	<div className="flex gap-1">
																		<Button
																			variant="ghost"
																			size="icon"
																			onClick={() => startEdit(cat)}
																			className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
																		>
																			<Pencil className="h-4 w-4" />
																		</Button>
																		<Button
																			variant="ghost"
																			size="icon"
																			onClick={() => setDeleteCategory(cat)}
																			className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
																		>
																			<Trash2 className="h-4 w-4" />
																		</Button>
																	</div>
																</div>
																{subcats.map((sub) => renderCategoryTree(sub, depth + 1))}
															</>
														);
													}
													return renderCategoryTree(category, 0);
												})()}
											</div>
										))}
									</div>
								)}
							</div>
						</TabsContent>

						<TabsContent value="hierarchy" className="mt-4">
							<CategoryHierarchyEditor
								categories={categories}
								onEdit={startEdit}
								onDelete={setDeleteCategory}
								onUpdate={onCategoriesChange}
							/>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!deleteCategory} onOpenChange={(isOpen) => !isOpen && setDeleteCategory(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Category</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{deleteCategory?.name}"? This will remove the category
							from all associated links (links won't be deleted).
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={loading}
							className="bg-destructive hover:bg-destructive/90"
						>
							{loading ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
