# Contratos HTTP

Cada rota deve declarar DTOs concretos para corpo, query/params estruturados e
resposta. Entities descrevem persistência e não devem ser retornadas diretamente.
A rota inicial retorna `GreetingResponseDto` (`{ "message": "Hello World!" }`).

O `ValidationPipe` global transforma entradas em instâncias dos DTOs e rejeita
campos sem validação declarada. Use `class-validator` nos DTOs de entrada; tipos
TypeScript sozinhos não validam dados recebidos. Regras entre registros e permissões
ficam no service/domínio; constraints do banco garantem a integridade persistida.

```ts
import { IsString, Length } from 'class-validator';

export class CreateTeamDto {
  /** Nome público da equipe. @example Equipe Azul */
  @IsString()
  @Length(1, 45)
  name!: string;
}
```

O plugin `@nestjs/swagger` analisa apenas arquivos `.dto.ts`, reaproveita validações
e comentários e infere tipos e obrigatoriedade. Para variações, importe `PartialType`,
`PickType` e `OmitType` de `@nestjs/swagger`. Declare respostas concretas por rota
com `@ApiOkResponse`/`@ApiCreatedResponse`. Descreva autenticação, erros de negócio,
paginação e respostas genéricas explicitamente: esses contratos não são inferidos
integralmente. Não coloque validadores de entrada nos DTOs de resposta apenas para
gerar documentação.

Swagger UI: `/api`. Documento OpenAPI: `/api-json`.
