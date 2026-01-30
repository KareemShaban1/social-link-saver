import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, ChevronRight, Grid3x3, Folder } from "lucide-react";
import { useState } from "react";

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
  /** Use vertical compact layout (e.g. for mobile sheet) */
  compact?: boolean;
}

// Helper function to lighten/darken colors for hover effects
const adjustColor = (color: string, amount: number): string => {
	const num = parseInt(color.replace("#", ""), 16);
	const r = Math.min(255, Math.max(0, (num >> 16) + amount));
	const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
	const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

// Helper function to get contrast color (white or black)
const getContrastColor = (color: string): string => {
	const num = parseInt(color.replace("#", ""), 16);
	const r = num >> 16;
	const g = (num >> 8) & 0x00ff;
	const b = num & 0x0000ff;
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 128 ? "#000000" : "#ffffff";
};

export const CategoryFilter = ({ categories, selectedCategory, onSelectCategory, compact = false }: CategoryFilterProps) => {
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

	const toggleExpand = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	const isExpanded = (categoryId: string) => expandedCategories.has(categoryId);

	// Compact vertical layout for mobile/sheet
	if (compact) {
		return (
			<div className="space-y-2">
				<Button
					variant={selectedCategory === null ? "default" : "outline"}
					size="sm"
					onClick={() => onSelectCategory(null)}
					className="w-full justify-start"
				>
					{selectedCategory === null && <Check className="h-4 w-4 mr-2" />}
					<Grid3x3 className="h-4 w-4 mr-2" />
					All categories
				</Button>
				{parentCategories.map((category) => {
					const subcategories = getSubcategories(category.id);
					const isSelected = selectedCategory === category.id;
					const expanded = isExpanded(category.id);
					return (
						<Collapsible key={category.id} open={expanded} onOpenChange={() => toggleExpand(category.id)}>
							<div className="rounded-lg border" style={{ borderColor: `${category.color}40` }}>
								<div className="flex items-center gap-2 p-2">
									<div className="w-4 h-4 rounded-full shrink-0 border-2" style={{ borderColor: category.color, backgroundColor: isSelected ? category.color : "transparent" }} />
									<Button
										variant={isSelected ? "default" : "ghost"}
										size="sm"
										className="flex-1 justify-start font-medium"
										style={isSelected ? { backgroundColor: category.color, color: getContrastColor(category.color) } : {}}
										onClick={() => onSelectCategory(category.id)}
									>
									{isSelected && <Check className="h-3 w-3 mr-1" />}
									{category.name}
								</Button>
								{subcategories.length > 0 && (
									<CollapsibleTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
											<ChevronRight className={`h-4 w-4 ${expanded ? "rotate-90" : ""}`} />
										</Button>
									</CollapsibleTrigger>
								)}
							</div>
							<CollapsibleContent>
								{subcategories.length > 0 && (
									<div className="pl-4 pr-2 pb-2 space-y-1 border-t" style={{ borderColor: `${category.color}20` }}>
										{subcategories.map((subcat) => {
											const isSubSelected = selectedCategory === subcat.id;
											return (
												<Button
													key={subcat.id}
													variant={isSubSelected ? "default" : "ghost"}
													size="sm"
													className="w-full justify-start text-sm"
													style={isSubSelected ? { backgroundColor: subcat.color, color: getContrastColor(subcat.color) } : {}}
													onClick={() => onSelectCategory(subcat.id)}
												>
													{isSubSelected && <Check className="h-3 w-3 mr-1" />}
													{subcat.name}
												</Button>
											);
										})}
									</div>
								)}
							</CollapsibleContent>
						</div>
						</Collapsible>
					);
				})}
				{parentCategories.length === 0 && (
					<div className="py-4 text-center text-sm text-muted-foreground">
						<Folder className="h-8 w-8 mx-auto mb-1 opacity-50" />
						No categories
					</div>
				)}
			</div>
		);
	}

  return (
	  <div className="space-y-3">
		  {/* Horizontal row (scrollable) */}
		  <div className="overflow-x-auto pb-2">
			  <div className="flex gap-3 min-w-max">
				  {/* All Categories pill */}
				  <Button
					  variant={selectedCategory === null ? "default" : "outline"}
					  size="sm"
					  onClick={() => onSelectCategory(null)}
					  className={`relative transition-all duration-300 group shrink-0 ${selectedCategory === null
						  ? "bg-gradient-to-r from-primary to-primary/80 shadow-md"
						  : "hover:shadow-sm"
						  }`}
				  >
					  <Grid3x3 className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
					  {selectedCategory === null && <Check className="h-4 w-4 mr-2" />}
					  <span className="font-semibold">All</span>
				  </Button>

				  {parentCategories.map((category) => {
				  const subcategories = getSubcategories(category.id);
				  const isSelected = selectedCategory === category.id;
				  const hasSelectedSubcategory = subcategories.some(sub => selectedCategory === sub.id);
				  const isParentSelected = isSelected || hasSelectedSubcategory;
				  const expanded = isExpanded(category.id);
				  const hoverColor = adjustColor(category.color, 20);
				  const selectedBgColor = `${category.color}20`;
				  const hoverBgColor = `${category.color}10`;

				  return (
		        <div key={category.id} className="flex flex-col shrink-0 w-[260px]">
			        {/* Category Column Card */}
			        <Collapsible
				        open={expanded}
				        onOpenChange={() => toggleExpand(category.id)}
			        >
				        <div
					        className={`group relative flex flex-col rounded-lg border-t-4 transition-all duration-300 ${isParentSelected
							        ? "shadow-lg border-opacity-100"
							        : "border-opacity-50 hover:border-opacity-100 hover:shadow-md"
						        }`}
					        style={{
						        borderTopColor: category.color,
						        backgroundColor: isSelected ? selectedBgColor : "transparent",
					        }}
				        >
					        {/* Category Header */}
					        <div className="p-3 border-b">
						        <div className="flex flex-col gap-3">
							        {/* Top Row: Color, Name, Expand */}
							        <div className="flex items-center gap-2">
								        {/* Category Color Indicator */}
								        <div
									        className="w-6 h-6 rounded-full border-2 shrink-0 transition-all duration-200 group-hover:scale-110"
									        style={{
										        backgroundColor: isSelected ? category.color : "transparent",
										        borderColor: category.color,
										        boxShadow: isSelected ? `0 0 8px ${category.color}40` : "none",
									        }}
								        />

								        {/* Category Name */}
								        <div className="flex-1 min-w-0">
									        <h3
										        className="font-semibold text-sm transition-colors duration-200 truncate"
										        style={{
											        color: isSelected ? category.color : "inherit",
										        }}
									        >
										        {category.name}
									        </h3>
								        </div>

								        {/* Expand/Collapse Icon */}
								        {subcategories.length > 0 && (
									        <CollapsibleTrigger asChild>
										        <Button
											        variant="ghost"
											        size="icon"
											        className="h-8 w-8 transition-all duration-200 shrink-0"
											        style={{
												        color: category.color,
											        }}
											        onMouseEnter={(e) => {
												        e.currentTarget.style.backgroundColor = hoverBgColor;
											        }}
											        onMouseLeave={(e) => {
												        e.currentTarget.style.backgroundColor = "transparent";
											        }}
										        >
											        <ChevronRight
												        className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""
													        }`}
											        />
										        </Button>
									        </CollapsibleTrigger>
								        )}
							        </div>

							        {/* Bottom Row: Badge and Select Button */}
							        <div className="flex items-center justify-between gap-2">
								        {/* Subcategory Count Badge */}
								        {subcategories.length > 0 && (
									        <Badge
										        variant="outline"
										        className="text-xs shrink-0 transition-all duration-200"
										        style={{
											        borderColor: category.color,
											        color: category.color,
											        backgroundColor: expanded ? hoverBgColor : "transparent",
										        }}
									        >
										        {subcategories.length}
									        </Badge>
								        )}

								        {/* Select Button */}
								        <Button
									        variant={isSelected ? "default" : "outline"}
									        size="sm"
									        onClick={(e) => {
										        e.stopPropagation();
										        onSelectCategory(category.id);
									        }}
									        className="flex-1 transition-all duration-200 group-hover:shadow-sm"
									        style={{
										        backgroundColor: isSelected ? category.color : "transparent",
										        borderColor: category.color,
										        color: isSelected ? getContrastColor(category.color) : category.color,
									        }}
									        onMouseEnter={(e) => {
										        if (!isSelected) {
											        e.currentTarget.style.backgroundColor = hoverBgColor;
											        e.currentTarget.style.borderColor = hoverColor;
											        e.currentTarget.style.color = hoverColor;
										        }
									        }}
									        onMouseLeave={(e) => {
										        if (!isSelected) {
											        e.currentTarget.style.backgroundColor = "transparent";
											        e.currentTarget.style.borderColor = category.color;
											        e.currentTarget.style.color = category.color;
										        }
									        }}
								        >
									        {isSelected && <Check className="h-3 w-3 mr-1" />}
									        {isSelected ? "Selected" : "Select"}
								        </Button>
							        </div>
						        </div>
					        </div>

					        {/* Subcategories List */}
					        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
						        {subcategories.length > 0 && (
							        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[260px] border-t" style={{ borderColor: `${category.color}20` }}>
								        {subcategories.map((subcat) => {
									        const isSubSelected = selectedCategory === subcat.id;
									        const subHoverColor = adjustColor(subcat.color, 20);
									        const subSelectedBgColor = `${subcat.color}20`;
									        const subHoverBgColor = `${subcat.color}10`;

									        return (
										        <div
											        key={subcat.id}
											        className={`group/sub relative rounded-md transition-all duration-200 ${isSubSelected ? "shadow-sm" : "hover:shadow-sm"
												        }`}
											        style={{
												        backgroundColor: isSubSelected ? subSelectedBgColor : "transparent",
											        }}
										        >
											        <div className="flex items-center gap-2 p-2">
												        {/* Subcategory Indicator */}
												        <div
													        className="w-3 h-3 rounded-full border shrink-0 transition-all duration-200 group-hover/sub:scale-125"
													        style={{
														        backgroundColor: isSubSelected ? subcat.color : "transparent",
														        borderColor: subcat.color,
														        boxShadow: isSubSelected ? `0 0 6px ${subcat.color}40` : "none",
													        }}
												        />

												        {/* Subcategory Name */}
												        <span
													        className="flex-1 text-sm font-medium transition-colors duration-200 truncate"
													        style={{
														        color: isSubSelected ? subcat.color : "inherit",
													        }}
												        >
													        {subcat.name}
												        </span>

												        {/* Select Button */}
												        <Button
													        variant={isSubSelected ? "default" : "ghost"}
													        size="sm"
													        onClick={() => onSelectCategory(subcat.id)}
													        className="h-7 px-2 text-xs shrink-0 transition-all duration-200"
													        style={{
														        backgroundColor: isSubSelected ? subcat.color : "transparent",
														        color: isSubSelected ? getContrastColor(subcat.color) : subcat.color,
													        }}
													        onMouseEnter={(e) => {
														        if (!isSubSelected) {
															        e.currentTarget.style.backgroundColor = subHoverBgColor;
															        e.currentTarget.style.color = subHoverColor;
														        }
													        }}
													        onMouseLeave={(e) => {
														        if (!isSubSelected) {
															        e.currentTarget.style.backgroundColor = "transparent";
															        e.currentTarget.style.color = subcat.color;
														        }
													        }}
												        >
													        {isSubSelected && <Check className="h-3 w-3 mr-1" />}
													        {isSubSelected ? "✓" : "Select"}
												        </Button>
											        </div>
										        </div>
									        );
								        })}
										  </div>
									  )}
								  </CollapsibleContent>
							  </div>
						  </Collapsible>
					  </div>
				  );
			  })}
			  </div>
		  </div>

		  {/* Empty State */}
		  {parentCategories.length === 0 && (
			  <div className="text-center py-8 text-muted-foreground">
				  <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
				  <p className="text-sm">No categories available</p>
			  </div>
		  )}
    </div>
  );
};
