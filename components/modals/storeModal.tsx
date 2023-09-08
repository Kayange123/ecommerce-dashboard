"use client";

import { useStoreModal } from "@/hooks/useStoreModal";
import { Modal } from "@/components/ui/modal";
import axios from 'axios';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import {  useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1),
});

export const StoreModal = () => {
  const router = useRouter();
    const [isLoading, setIsLoading] = useState(false)
    const storeModal = useStoreModal();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
  const onSubmit = async (values: z.infer<typeof formSchema>)=>{
    //Create a store
    try {
        setIsLoading(true);
        const {data} = await axios.post('/api/stores', values);
        toast.success(`your store ${data?.name} is created`);
        router.refresh();
        storeModal.onClose();
        router.replace(`/${data?.id}`);
        // window.location.assign(`${data?.id}`)
    } catch (error) {
        toast.error("something went wrong");
    }finally{
        setIsLoading(false);
    }
  }
  return (
    <Modal
      title="Create your store"
      description="Add new store to manage your products and categories"
      isOpen={storeModal.isOpen}
      onClose={storeModal.onClose}
    >
        <div className="space-y-4 py-2 pb-3">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField 
                    control={form.control}
                    name="name"
                    render={({field}) =>(
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl
                            >
                                <Input disabled={isLoading} placeholder="E-commerce" {...field}/>
                            </FormControl> 
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="pt-5 space-x-2 flex items-center justify-end">
                        <Button disabled={isLoading} variant="outline" onClick={storeModal.onClose}>cancel</Button>
                        <Button disabled={isLoading} type="submit">continue</Button>
                    </div>
                </form>
            </Form>
        </div>
    </Modal>
  );
};
