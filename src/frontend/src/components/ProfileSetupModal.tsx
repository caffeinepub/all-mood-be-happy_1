import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({
  open,
  onComplete,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const { mutateAsync: saveProfile, isPending } = useSaveUserProfile();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile({ name: name.trim() });
      toast.success(`Welcome, ${name.trim()}! 🎉`);
      onComplete();
    } catch {
      toast.error("Could not save profile. Please try again.");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md rounded-2xl"
        data-ocid="profile_setup.dialog"
      >
        <DialogHeader className="text-center">
          <div className="text-4xl mb-2">👋</div>
          <DialogTitle className="text-xl font-bold">
            Welcome to All Mood Be Happy!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Let's set up your profile so the community can know you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="e.g. Alex, Priya, Maya..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="rounded-xl"
              data-ocid="profile_setup.name_input"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="w-full rounded-full bg-foreground text-white font-semibold"
            data-ocid="profile_setup.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Start my journey 🌟"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
