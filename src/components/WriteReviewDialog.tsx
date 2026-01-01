import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WriteReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  reviewedId: string;
  reviewedName: string;
  reviewerRole: "landlord" | "tenant";
}

const StarInput = ({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const WriteReviewDialog = ({
  open,
  onOpenChange,
  contractId,
  reviewedId,
  reviewedName,
  reviewerRole,
}: WriteReviewDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [overallRating, setOverallRating] = useState(0);
  const [paymentRating, setPaymentRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [propertyRating, setPropertyRating] = useState(0);
  const [respectRating, setRespectRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (overallRating === 0) throw new Error("Please provide an overall rating");

      const { error } = await supabase.from("rental_reviews").insert({
        contract_id: contractId,
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        reviewer_role: reviewerRole,
        overall_rating: overallRating,
        payment_rating: paymentRating || null,
        communication_rating: communicationRating || null,
        property_condition_rating: propertyRating || null,
        respect_rating: respectRating || null,
        review_text: reviewText || null,
        pros: pros.length > 0 ? pros : null,
        cons: cons.length > 0 ? cons : null,
        status: "published",
        is_verified: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["user-reviews", reviewedId] });
      queryClient.invalidateQueries({ queryKey: ["user-reputation", reviewedId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar avaliação");
    },
  });

  const resetForm = () => {
    setOverallRating(0);
    setPaymentRating(0);
    setCommunicationRating(0);
    setPropertyRating(0);
    setRespectRating(0);
    setReviewText("");
    setPros([]);
    setCons([]);
  };

  const addPro = () => {
    if (newPro.trim() && pros.length < 5) {
      setPros([...pros, newPro.trim()]);
      setNewPro("");
    }
  };

  const addCon = () => {
    if (newCon.trim() && cons.length < 5) {
      setCons([...cons, newCon.trim()]);
      setNewCon("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar {reviewedName}</DialogTitle>
          <DialogDescription>
            Partilhe a sua experiência para ajudar outros utilizadores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <StarInput
            value={overallRating}
            onChange={setOverallRating}
            label="Avaliação Geral *"
          />

          {/* Category Ratings */}
          <div className="grid grid-cols-2 gap-4">
            {reviewerRole === "landlord" ? (
              <>
                <StarInput
                  value={paymentRating}
                  onChange={setPaymentRating}
                  label="Pagamentos"
                />
                <StarInput
                  value={respectRating}
                  onChange={setRespectRating}
                  label="Respeito pelo Imóvel"
                />
              </>
            ) : (
              <>
                <StarInput
                  value={propertyRating}
                  onChange={setPropertyRating}
                  label="Condição do Imóvel"
                />
                <StarInput
                  value={communicationRating}
                  onChange={setCommunicationRating}
                  label="Comunicação"
                />
              </>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label>Comentário</Label>
            <Textarea
              placeholder="Descreva a sua experiência..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
          </div>

          {/* Pros */}
          <div className="space-y-2">
            <Label>Pontos Positivos</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Sempre pontual"
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPro())}
              />
              <Button type="button" size="icon" variant="outline" onClick={addPro}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pros.map((pro, i) => (
                <Badge key={i} variant="secondary" className="bg-green-100 text-green-700">
                  {pro}
                  <button onClick={() => setPros(pros.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3 ml-1" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div className="space-y-2">
            <Label>Pontos a Melhorar</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Comunicação lenta"
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCon())}
              />
              <Button type="button" size="icon" variant="outline" onClick={addCon}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cons.map((con, i) => (
                <Badge key={i} variant="secondary" className="bg-red-100 text-red-700">
                  {con}
                  <button onClick={() => setCons(cons.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3 ml-1" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={overallRating === 0 || submitMutation.isPending}
          >
            {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
