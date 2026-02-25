import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ShoppingItem } from "../types/database";

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setItems(data);
  }, []);

  useEffect(() => {
    refetch().then(() => setLoading(false));

    const channel = supabase
      .channel("shopping_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shopping_items" },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shopping_items" },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "shopping_items" },
        () => refetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const addItem = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await supabase.from("shopping_items").insert({ text: trimmed });
  }, []);

  const toggleItem = useCallback(async (id: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !checked } : it)),
    );
    await supabase
      .from("shopping_items")
      .update({ checked: !checked })
      .eq("id", id);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await supabase.from("shopping_items").delete().eq("id", id);
  }, []);

  const clearChecked = useCallback(async () => {
    setItems((prev) => prev.filter((it) => !it.checked));
    await supabase.from("shopping_items").delete().eq("checked", true);
  }, []);

  return { items, loading, addItem, toggleItem, deleteItem, clearChecked };
}
