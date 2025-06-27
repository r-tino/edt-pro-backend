// src/auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

// La clé utilisée pour stocker les métadonnées indiquant qu'une route est publique.
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Décorateur personnalisé pour marquer une route comme "publique",
 * c'est-à-dire qu'elle ne nécessite pas d'authentification JWT.
 * Le JwtAuthGuard vérifiera cette métadonnée.
 * @returns Décorateur SetMetadata qui associe la clé IS_PUBLIC_KEY à la valeur true.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
