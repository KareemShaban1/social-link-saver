import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Pencil, Trash2, Palette, FolderTree } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { formFieldClass } from "@/lib/formStyles";
import { cn } from "@/lib/utils";
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
	/** Render the manager inline on a page instead of inside a dialog. */
	embedded?: boolean;
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

export const CategoryManager = ({
	categories,
	onCategoriesChange,
	embedded = false,
}: CategoryManagerProps) => {
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
	const [parentId, setParentId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("form");
	const { toast } = useToast();
	const { t } = useTranslation();

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

	const handleDialogOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) resetForm();
	};

	const handleAdd = async () => {
		if (!newName.trim()) {
			toast({
				title: t("categoryManager.nameRequired"),
				description: t("categoryManager.nameRequiredDesc"),
				variant: "destructive",
			});
			return;
		}

		if (!user) {
			toast({
				title: t("common.error"),
				description: t("categoryManager.mustBeLoggedIn"),
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
				title: t("common.success"),
				description: t("categoryManager.createdSuccess"),
			});

			resetForm();
			onCategoriesChange();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : t("categoryManager.saveFailed");
			toast({
				title: t("common.error"),
				description: message,
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = async () => {
		if (!editingCategory || !newName.trim()) {
			toast({
				title: t("categoryManager.nameRequired"),
				description: t("categoryManager.nameRequiredDesc"),
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
				title: t("common.success"),
				description: t("categoryManager.updatedSuccess"),
			});

			resetForm();
			onCategoriesChange();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : t("categoryManager.saveFailed");
			toast({
				title: t("common.error"),
				description: message,
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
				title: t("common.success"),
				description: t("categoryManager.deletedSuccess"),
			});

			setDeleteCategory(null);
			onCategoriesChange();
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : t("categoryManager.deleteFailed");
			toast({
				title: t("common.error"),
				description: message,
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
		setActiveTab("form");
	};

	const managerContent = (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
			<TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
				<TabsTrigger value="form" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
					<Plus className="h-4 w-4" />
					{t("categoryManager.addEditTab")}
				</TabsTrigger>
				<TabsTrigger value="hierarchy" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
					<FolderTree className="h-4 w-4" />
					{t("categoryManager.hierarchy")}
				</TabsTrigger>
			</TabsList>

						<TabsContent value="form" className="mt-4 space-y-4">
							<div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
								<h3 className="text-sm font-semibold text-gray-900">
									{editingCategory ? t("categoryManager.editCategory") : t("categoryManager.addNewCategory")}
								</h3>
								<div className="space-y-3">
									<div className="space-y-2">
										<Label htmlFor="category-name">{t("categoryManager.categoryName")}</Label>
										<Input
											id="category-name"
											value={newName}
											onChange={(e) => setNewName(e.target.value)}
											placeholder={t("categoryManager.namePlaceholder")}
											className={formFieldClass}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="parent-category">{t("categoryManager.parentCategoryOptional")}</Label>
										<select
											id="parent-category"
											title={t("categoryManager.parentCategory")}
											value={parentId || ""}
											onChange={(e) => setParentId(e.target.value || null)}
											className={cn(
												"h-10 w-full appearance-none px-3 text-sm",
												formFieldClass,
												parentId ? "text-gray-900" : "text-gray-500",
											)}
										>
											<option value="" className="bg-white text-gray-500">
												{t("categoryManager.noneTopLevelLong")}
											</option>
											{getParentOptions().map(({ id, label, depth }) => (
												<option key={id} value={id} className="bg-white text-gray-900">
													{depth === 0 ? label : "\u00A0\u00A0".repeat(depth) + "└─ " + label}
												</option>
											))}
										</select>
										<p className="text-xs text-gray-500">{t("categoryManager.parentHint")}</p>
									</div>
									<div className="space-y-2">
										<Label>{t("categoryManager.color")}</Label>
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
													title={t("categoryManager.customColor")}
												/>
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										{editingCategory ? (
											<>
												<Button onClick={handleEdit} disabled={loading} className="flex-1 rounded-full">
													{t("categoryManager.updateCategory")}
												</Button>
												<Button onClick={resetForm} variant="outline" disabled={loading} className="rounded-full border-gray-200">
													{t("common.cancel")}
												</Button>
											</>
										) : (
											<Button onClick={handleAdd} disabled={loading} className="w-full rounded-full">
												<Plus className="me-2 h-4 w-4" />
												{t("categoryManager.addCategory")}
											</Button>
										)}
									</div>
								</div>
							</div>

							{/* Categories List (recursive tree) */}
							<div className="space-y-2">
								<h3 className="text-sm font-semibold text-gray-900">{t("categoryManager.existingCategories")}</h3>
								{categories.length === 0 ? (
									<p className="py-8 text-center text-sm text-gray-500">{t("categoryManager.noCategoriesHint")}</p>
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
																	className={`flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-shadow hover:shadow-sm ${isTop ? "bg-white" : "bg-gray-50"}`}
																	style={depth > 0 ? { marginLeft: depth * 20 } : undefined}
																>
																	<div className="flex items-center gap-3">
																		<div
																			className={`rounded-lg shrink-0 ${isTop ? "w-8 h-8" : "w-6 h-6"}`}
																			style={{ backgroundColor: cat.color }}
																		/>
																		<span className={isTop ? "font-medium text-black" : "font-medium text-sm text-black"}>{cat.name}</span>
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
	);

	const deleteDialog = (
		<AlertDialog open={!!deleteCategory} onOpenChange={(isOpen) => !isOpen && setDeleteCategory(null)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("categoryManager.deleteCategory")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("categoryManager.deleteConfirmDesc", { name: deleteCategory?.name ?? "" })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading} className="rounded-full">
						{t("common.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={loading}
						className="rounded-full bg-destructive hover:bg-destructive/90"
					>
						{loading ? t("categoryManager.deleting") : t("common.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	if (embedded) {
		return (
			<>
				{managerContent}
				{deleteDialog}
			</>
		);
	}

	return (
		<>
			<Dialog open={open} onOpenChange={handleDialogOpenChange}>
				<DialogTrigger asChild>
					<Button variant="outline" className="rounded-full border-gray-200 hover:border-indigo-200 hover:bg-indigo-50">
						<Settings className="me-2 h-4 w-4" />
						{t("categoryManager.title")}
					</Button>
				</DialogTrigger>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[700px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-gray-900">
							<Palette className="h-5 w-5 text-primary" />
							{t("categoryManager.title")}
						</DialogTitle>
					</DialogHeader>
					{managerContent}
				</DialogContent>
			</Dialog>
			{deleteDialog}
		</>
	);
};
