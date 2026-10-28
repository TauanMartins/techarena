# Contratos HTTP

Cada rota deve declarar DTOs concretos para corpo, query/params estruturados e
resposta. Entities descrevem persistência e não devem ser retornadas diretamente.
A rota `/health` retorna `HealthResponseDto` e verifica a conexão com PostgreSQL.

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
com `@ResponseContract(Dto, status)`. Descreva autenticação, erros de negócio,
paginação e respostas genéricas explicitamente: esses contratos não são inferidos
integralmente. Validadores nos DTOs de saída verificam o contrato em tempo de execução.

Swagger UI: `/api`. Documento OpenAPI: `/api-json`.

Use `@ResponseContract(Dto, status)` para documentar, projetar e validar cada resposta.
DTOs de saída usam `@Expose()` e validadores; propriedades internas não são serializadas.
