"use client";

import React from "react";
import { Check, X, Globe, Mic, DollarSign, Type } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LANGS, CURRENCIES, LangCode, CurrencyCode } from "../data";

interface PreferencesDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // State
    displayLang: LangCode;
    setDisplayLang: (l: LangCode) => void;
    audioLang: LangCode;
    setAudioLang: (l: LangCode) => void;
    currencyCode: CurrencyCode;
    setCurrencyCode: (c: CurrencyCode) => void;
    voiceTranslationOn: boolean;
    setVoiceTranslationOn: (b: boolean) => void;
    captionsOn: boolean;
    setCaptionsOn: (b: boolean) => void;
    translateChatOn: boolean;
    setTranslateChatOn: (b: boolean) => void;
    isOverridden: boolean;
    clearOverride: () => void;
    t: (k: string) => string;
}

export function PreferencesDrawer({
    open,
    onOpenChange,
    displayLang,
    setDisplayLang,
    audioLang,
    setAudioLang,
    currencyCode,
    setCurrencyCode,
    voiceTranslationOn,
    setVoiceTranslationOn,
    captionsOn,
    setCaptionsOn,
    translateChatOn,
    setTranslateChatOn,
    isOverridden,
    clearOverride,
    t,
}: PreferencesDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:w-[420px] overflow-y-auto bg-background border-border text-foreground">
                <SheetHeader>
                    <SheetTitle className="text-foreground">{t("preferences")}</SheetTitle>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Status Alert */}
                    <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300">
                        <AlertDescription className="text-xs">
                            Defaults loaded from your global profile. Correct for this session below.
                        </AlertDescription>
                    </Alert>

                    {isOverridden && (
                        <div className="flex items-center justify-between bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-300">Custom settings active</span>
                            <Button variant="ghost" size="sm" onClick={clearOverride} className="h-6 text-xs text-yellow-600 dark:text-yellow-300 hover:bg-yellow-500/20">
                                Reset to Defaults
                            </Button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Display Language */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("displayLanguage")}</Label>
                            <Select value={displayLang} onValueChange={(v) => setDisplayLang(v as LangCode)}>
                                <SelectTrigger className="w-full bg-background border-input text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    {LANGS.map(l => (
                                        <SelectItem key={l.code} value={l.code}>{l.label} ({l.native})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Audio Language */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("audioLanguage")}</Label>
                            <Select value={audioLang} onValueChange={(v) => setAudioLang(v as LangCode)}>
                                <SelectTrigger className="w-full bg-background border-input text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    {LANGS.map(l => (
                                        <SelectItem key={l.code} value={l.code}>{l.label} ({l.native})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Currency */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("currency")}</Label>
                            <Select value={currencyCode} onValueChange={(v) => setCurrencyCode(v as CurrencyCode)}>
                                <SelectTrigger className="w-full bg-background border-input text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    {CURRENCIES.map(c => (
                                        <SelectItem key={c.code} value={c.code}>{c.code} · {c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mic className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm font-medium text-foreground">{t("audio")} Translation</Label>
                            </div>
                            <Switch checked={voiceTranslationOn} onCheckedChange={setVoiceTranslationOn} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Type className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm font-medium text-foreground">{t("captions")}</Label>
                            </div>
                            <Switch checked={captionsOn} onCheckedChange={setCaptionsOn} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm font-medium text-foreground">{t("translateChat")}</Label>
                            </div>
                            <Switch checked={translateChatOn} onCheckedChange={setTranslateChatOn} />
                        </div>
                    </div>

                    <Button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
