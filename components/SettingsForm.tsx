"use client";

import { useState } from "react";
import { z } from "zod";
import { Store } from "@prisma/client";
import Heading from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Trash } from "lucide-react";
import { Separator } from "./ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
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
import ApiAlert from "./ui/api-alert";
import { useOrigin } from "@/hooks/useOrigin";

interface SettingsFormProps {
  initialData: Store;
  counts: {
    products: number;
    categories: number;
    billboards: number;
    sizes: number;
  };
}
const formSchema = z.object({
  name: z
    .string()
    .min(3, { error: "Store name must be at least 3 characters." }),
});
type SettingsFormValues = z.infer<typeof formSchema>;

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const SettingsForm = ({ initialData, counts }: SettingsFormProps) => {
  const deleteParts = [
    counts.products > 0 && pluralize(counts.products, "product", "products"),
    counts.categories > 0 &&
      pluralize(counts.categories, "category", "categories"),
    counts.billboards > 0 &&
      pluralize(counts.billboards, "billboard", "billboards"),
    counts.sizes > 0 && pluralize(counts.sizes, "size", "sizes"),
  ].filter((part): part is string => Boolean(part));
  const deleteDescription =
    deleteParts.length > 0
      ? `This will permanently delete ${deleteParts.join(", ")}. This action cannot be undone.`
      : "This action cannot be undone.";

  const origin = useOrigin();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/stores/${params.storeId}`, data);
      router.refresh();
      toast.success("Changes saved successfully.");
    } catch (error) {
      toast.error("Failed to save settings.");
    } finally {
      setIsLoading(false);
    }
  };
  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/stores/${params.storeId}`);
      router.refresh();
      router.push("/");
      toast.success("Store deleted!");
    } catch (error) {
      toast.error("Make sure you don't have any products or categories first.");
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
        title={`Delete "${initialData.name}"?`}
        description={deleteDescription}
      />
      <Heading
        icon={SettingsIcon}
        title="Store settings"
        description="Manage store preferences"
        action={
          <Button
            disabled={isLoading}
            variant="destructive"
            onClick={() => setIsOpen(true)}
            size="sm"
          >
            <Trash className="h-4 w-4" />
          </Button>
        }
      />
      <Separator />
      <Form {...form}>
        <form
          className="w-full space-y-8"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid gap-8 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="store name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={isLoading} className="ml-auto" type="submit">
            save changes
          </Button>
        </form>
      </Form>
      <Separator />
      <ApiAlert
        title="NEXT_PUBLIC_API_URL"
        description={`${origin}/api/${params.storeId}`}
        variant="public"
      />
    </>
  );
};

export default SettingsForm;
