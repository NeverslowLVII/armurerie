import { NextRequest, NextResponse } from 'next/server';

/**
 * Valide et convertit un ID de paramètre en nombre
 * @param id L'ID à valider
 * @returns Un tuple [boolean, number | null, Response | null] indiquant si l'ID est valide, l'ID converti et une éventuelle réponse d'erreur
 */
export function validateId(id: string | undefined): [boolean, number | null, NextResponse | null] {
  if (!id || id === 'null') {
    return [false, null, NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 })];
  }

  const parsedId = Number.parseInt(id);
  if (Number.isNaN(parsedId)) {
    return [false, null, NextResponse.json({ error: 'Invalid ID format', id }, { status: 400 })];
  }

  return [true, parsedId, null];
}

/**
 * Wrapper pour les gestionnaires d'API avec gestion d'erreur standardisée
 * @param handler La fonction gestionnaire à exécuter
 * @returns Une fonction qui peut être utilisée comme gestionnaire de route API
 */
export function withErrorHandling<T>(handler: () => Promise<T>): Promise<T | NextResponse> {
  return handler().catch(error => {
    console.error('API error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const details = error instanceof Error ? { name: error.name, stack: error.stack } : {};

    return NextResponse.json(
      {
        error: 'An error occurred',
        message,
        ...details,
      },
      { status: 500 }
    );
  });
}

/**
 * Gestionnaire standard pour les requêtes GET d'entités par ID
 * @param params Les paramètres de la requête contenant l'ID
 * @param fetchFn La fonction pour récupérer l'entité par ID
 * @param entityName Le nom de l'entité (pour les messages d'erreur)
 * @returns Une réponse NextResponse
 */
export async function handleGetById(
  params: { id: string },
  fetchFn: (id: number) => Promise<any | null>,
  entityName: string
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const [isValid, id, errorResponse] = validateId(params.id);
    if (!isValid) return errorResponse as NextResponse;

    const entity = await fetchFn(id as number);
    if (!entity) {
      return NextResponse.json(
        {
          error: `${entityName} not found`,
          id,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(entity);
  }) as Promise<NextResponse>;
}

/**
 * Gestionnaire standard pour les requêtes DELETE d'entités par ID
 * @param params Les paramètres de la requête contenant l'ID
 * @param deleteFn La fonction pour supprimer l'entité par ID
 * @param entityName Le nom de l'entité (pour les messages d'erreur)
 * @param beforeDelete Fonction optionnelle à exécuter avant la suppression
 * @param afterDelete Fonction optionnelle à exécuter après la suppression
 * @returns Une réponse NextResponse
 */
export async function handleDeleteById(
  params: { id: string },
  deleteFn: (id: number) => Promise<any>,
  entityName: string,
  beforeDelete?: (id: number) => Promise<boolean | void>,
  afterDelete?: (id: number, deletedEntity: any) => Promise<void>
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const [isValid, id, errorResponse] = validateId(params.id);
    if (!isValid) return errorResponse as NextResponse;

    // Exécuter la fonction avant suppression si elle existe
    if (beforeDelete) {
      const shouldProceed = await beforeDelete(id as number);
      if (shouldProceed === false) {
        return NextResponse.json({ error: `Cannot delete ${entityName}` }, { status: 403 });
      }
    }

    const deletedEntity = await deleteFn(id as number);

    // Exécuter la fonction après suppression si elle existe
    if (afterDelete && deletedEntity) {
      await afterDelete(id as number, deletedEntity);
    }

    return NextResponse.json({ success: true, id });
  }) as Promise<NextResponse>;
}

/**
 * Crée des en-têtes CORS standards pour les réponses OPTIONS
 * @returns Une instance de NextResponse avec les en-têtes CORS appropriés
 */
export function createCorsOptionsResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Analyse le corps de la requête en JSON avec gestion d'erreur
 * @param request La requête à analyser
 * @returns Un tuple [données analysées, erreur]
 */
export async function parseRequestBody<T>(
  request: NextRequest
): Promise<[T | null, NextResponse | null]> {
  try {
    const data = (await request.json()) as T;
    return [data, null];
  } catch (error) {
    return [
      null,
      NextResponse.json(
        {
          error: 'Invalid request body',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 }
      ),
    ];
  }
}
