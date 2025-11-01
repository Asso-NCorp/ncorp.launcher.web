<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import * as Tooltip from "$lib/components/ui/tooltip";

    interface Achievement {
        id: string;
        title: string;
        icon: string;
        color: string;
    }

    let { achievements }: { achievements: Achievement[] } = $props();

    const achievementDescriptions: Record<string, { description: string; criterion: string }> = {
        "100h": {
            description: "Vous avez atteint 100 heures de jeu !",
            criterion: "100+ heures cumulées",
        },
        "50h": {
            description: "Vous avez accumulé 50 heures de jeu.",
            criterion: "50+ heures cumulées",
        },
        "10h": {
            description: "Vous faites vos premiers pas en tant que gamer.",
            criterion: "10+ heures cumulées",
        },
        "5games": {
            description: "Vous avez exploré plusieurs univers différents.",
            criterion: "5+ jeux différents joués",
        },
        "10games": {
            description: "Vous êtes un véritable explorateur de mondes virtuels !",
            criterion: "10+ jeux différents joués",
        },
        "20sessions": {
            description: "Vous êtes un joueur assidu et régulier.",
            criterion: "20+ sessions de jeu",
        },
    };
</script>

{#if achievements.length > 0}
    <Card>
        <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2">
                <iconify-icon icon="mdi:trophy" class="text-yellow-500"></iconify-icon>
                Succès et badges
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {#each achievements as achievement}
                    {@const details = achievementDescriptions[achievement.id]}
                    <Tooltip.Root>
                        <Tooltip.Trigger>
                            <div
                                class="border-muted bg-muted/30 hover:border-primary/50 hover:bg-primary/10 flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md">
                                <div class="mb-1 text-3xl">{achievement.icon}</div>
                                <span class="text-center text-xs leading-tight font-medium">{achievement.title}</span>
                            </div>
                        </Tooltip.Trigger>
                        <Tooltip.Content side="top" class="bg-popover">
                            <div class="space-y-2">
                                <p class="text-sm font-semibold">{achievement.title}</p>
                                {#if details}
                                    <p class="text-sm">{details.description}</p>
                                    <div class="border-muted-foreground/20 border-t pt-2">
                                        <p class="text-muted-foreground text-xs">
                                            <strong>Critère:</strong>
                                            {details.criterion}
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        </Tooltip.Content>
                    </Tooltip.Root>
                {/each}
            </div>
        </CardContent>
    </Card>
{/if}
