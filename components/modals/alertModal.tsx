"use client"
import { useEffect, useState } from "react"
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

interface AlertModalProps {
    isOpen: boolean,
    onClose: ()=> void,
    onConfirm: ()=> void,
    isLoading: boolean,
}

const AlertModal = ({ isLoading, isOpen , onClose, onConfirm}:AlertModalProps) => {

    const [isMounted, setIsMounted] = useState(false);

    useEffect(()=>{
        setIsMounted(true);
    },[])

    if(!isMounted){
        return null;
    }
  return (
    <Modal 
    title="Are you sure?" 
    description="This action can not be undone"
    isOpen={isOpen}
    onClose={onClose}
    >
        <div className="pt-6 space-x-2 flex items-center justify-end w-full">
            <Button disabled={isLoading} type="button" variant="outline" onClick={onClose} >
                Cancel
            </Button>
            <Button disabled={isLoading} type="submit" variant="destructive" onClick={onConfirm} >
                Continue
            </Button>
        </div>
    </Modal>
  )
}

export default AlertModal