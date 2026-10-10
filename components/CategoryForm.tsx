"use client";

import { useState } from "react";
import { z } from "zod";
import Heading from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { Tags, Trash } from "lucide-react";
import { Separator } from "./ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import AlertModal from "./modals/alertModal";
import ImageUpload from "./ui/ImageUpload";
import { Billboard, Category } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CategoryFormProps {
  initialData: Category | null;
  billboards: Billboard[];
  productCount: number;
}
const formSchema = z.object({
  billboardId: z.string().min(1, { error: "Please select a billboard." }),
  name: z.string().min(3, { error: "Name must be at least 3 characters." }),
});
type CategoryFormValues = z.infer<typeof formSchema>;

const CategoryForm = ({
  initialData,
  billboards,
  productCount,
}: CategoryFormProps) => {
  const title = initialData ? "Edit Category" : "Create Category";
  const description = initialData
    ? "Edit a Category"
    : "Create a new Category for your billboard";
  const action = initialData ? "save changes" : "Create";
  const toastMessage = initialData ? "Changes saved" : "Category Created";

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      billboardId: "",
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsLoading(true);
      if (initialData) {
        await axios.patch(
          `/api/${params?.storeId}/categories/${params?.categoryId}`,
          data
        );
      } else {
        await axios.post(`/api/${params.storeId}/categories`, data);
      }
      router.refresh();
      router.push(`/${params.storeId}/categories`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error("Failed to save category.");
    } finally {
      setIsLoading(false);
    }
  };
  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/${params.storeId}/categories/${params.categoryId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/categories`);
      toast.success("category deleted!");
    } catch (error) {
      toast.error("You can't delete a category containing products");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };
  return (
    <>
      <AlertModal
        isLoading={isLoading}
        onClose={() => setIsOpen(false)}
        onConfirm={onDelete}
        isOpen={isOpen}
        title={initialData ? `Delete "${initialData.name}"?` : undefined}
        description={
          productCount > 0
            ? `Used by ${productCount} ${productCount === 1 ? "product" : "products"}. This action cannot be undone.`
            : undefined
        }
      />
      <Heading
        icon={Tags}
        title={title}
        description={description}
        action={
          initialData && (
            <Button
              disabled={isLoading}
              variant="destructive"
              onClick={() => setIsOpen(true)}
              size="sm"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )
        }
      />
      <Separator />
      <Form {...form}>
        <form
          className="w-full space-y-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid gap-8 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormDescription>
                    Label describing your category
                  </FormDescription>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Category label"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billboardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billboard</FormLabel>
                  <FormDescription>
                    A category belongs to a billboard
                  </FormDescription>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder="Select a billboard"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {billboards.map((billboard) => (
                        <SelectItem value={billboard.id} key={billboard.id}>
                          {billboard.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={isLoading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default CategoryForm;
