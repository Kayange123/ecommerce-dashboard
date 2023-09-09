"use client";

import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import {CldUploadWidget} from "next-cloudinary"
import { Button } from "./button";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";


interface ImageUploadProps {
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    values: string[];
    disabled?: boolean
}
const ImageUpload = ({disabled, values, onChange, onRemove}:ImageUploadProps) =>{
    const [isMounted, setIsMounted] = useState(false);
    useEffect(()=>{
        setIsMounted(true);
    },[])

    //if(!isMounted) redirect('/');

    const onUpload = (res: any)=>{
        onChange(res?.info?.secure_url);
    }
    return (
        <div>
            <div className="mb-4 flex items-center gap-5">
                {values?.map((url)=>(
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden">
                        <div className="z-10 absolute top-2 right-2">
                            <Button type="button" onClick={()=> onRemove(url)} size="icon" variant="destructive" >
                                <Trash className="w-4 h-4" />
                            </Button>
                        </div>
                        <Image
                        src={url}
                        alt="cover image"
                        className="object-cover"
                        fill
                        />
                    </div>
                ))}
            </div>
            <CldUploadWidget onUpload={onUpload} uploadPreset="nqrwjzcc">
                {({open})=> {
                    const onClick = () => {
                        open();
                    }
                    return (
                        <Button type="button" disabled={disabled} onClick={onClick} variant="secondary">
                            <ImagePlus className="w-5 h-5 mr-2" />
                            <span>Upload image</span>
                        </Button>
                    )
                }}
            </CldUploadWidget>
        </div>
    )
}

export default ImageUpload;