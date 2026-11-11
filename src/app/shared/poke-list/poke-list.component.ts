import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PokeApiService, PokemonDetails } from 'src/app/service/poke-api.service';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'poke-list',
  templateUrl: './poke-list.component.html',
  styleUrls: ['./poke-list.component.scss']
})

export class PokeListComponent implements OnInit, OnDestroy {
  public get totalPages(): number {
    return this.totalPokemons ? Math.ceil(this.totalPokemons / this.limit) : 1;
  }
  public apiError: boolean = false;
  public getAllPokemons: Array<{ name: string; status: PokemonDetails }> = [];
  public currentPage: number = 1;
  public limit: number = 20;
  public isLoading: boolean = false;
  public totalPokemons: number = 0;

  private destroy$ = new Subject<void>();
  private request?: Subscription;

  constructor(
    private pokeService: PokeApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  // A página fica na URL (?page=N): sobrevive ao "Voltar", ao F5 e pode ser compartilhada
  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const page = Number(params.get('page'));
      this.currentPage = Number.isInteger(page) && page >= 1 ? page : 1;
      this.loadPokemons();
    });
  }

  ngOnDestroy() {
    this.request?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPokemons() {
    // Cancela a página anterior se o usuário clicar rápido em "Próxima"
    this.request?.unsubscribe();
    this.isLoading = true;
    this.apiError = false;
    const offset = (this.currentPage - 1) * this.limit;
    this.request = this.pokeService.apiListAllPokemons(offset, this.limit).pipe(
      switchMap(res => {
        this.totalPokemons = res.count;
        if (!res.results.length) {
          return of([]);
        }
        return forkJoin(res.results.map(pokemon =>
          this.pokeService.apiGetPokemons(pokemon.url).pipe(
            map(status => ({ name: pokemon.name, status }))
          )
        ));
      })
    ).subscribe({
      next: pokemons => {
        this.getAllPokemons = pokemons;
        this.isLoading = false;
      },
      error: () => {
        this.apiError = true;
        this.isLoading = false;
      }
    });
  }

  public getSearch(value: string) {
    if (!value) {
      this.loadPokemons();
      return;
    }
    // Só busca na API se o valor for igual a um nome válido (autocomplete)
    const validNames = (window as any).allPokemonNames || [];
    this.request?.unsubscribe();
    if (validNames.includes(value.toLowerCase())) {
      this.isLoading = true;
      this.apiError = false;
      this.request = this.pokeService.apiGetPokemons(`https://pokeapi.co/api/v2/pokemon/${value.toLowerCase()}`).subscribe({
        next: details => {
          this.getAllPokemons = [{
            name: details.name,
            status: details
          }];
          this.isLoading = false;
        },
        error: () => {
          this.getAllPokemons = [];
          this.isLoading = false;
          this.apiError = true;
        }
      });
    } else {
      // Apenas limpa a lista e mostra sugestões, sem buscar na API
      this.getAllPokemons = [];
      this.apiError = false;
      this.isLoading = false;
    }
  }

  public nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goTo(this.currentPage + 1);
    }
  }

  public prevPage() {
    if (this.currentPage > 1) {
      this.goTo(this.currentPage - 1);
    }
  }

  public goToPage(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isInteger(value) && value >= 1 && value <= this.totalPages) {
      this.goTo(value);
    } else {
      input.value = String(this.currentPage);
    }
  }

  private goTo(page: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge'
    });
  }
}
