import { Component, OnInit } from '@angular/core';
import { PokeApiService, PokemonListResponse, PokemonDetails } from 'src/app/service/poke-api.service';
import { forkJoin, tap, of } from 'rxjs';

@Component({
  selector: 'poke-list',
  templateUrl: './poke-list.component.html',
  styleUrls: ['./poke-list.component.scss']
})

export class PokeListComponent implements OnInit {
  public get totalPages(): number {
    return this.totalPokemons ? Math.ceil(this.totalPokemons / this.limit) : 1;
  }
  public apiError: boolean = false;
  public getAllPokemons: Array<{ name: string; status: PokemonDetails }> = [];
  public currentPage: number = 1;
  public limit: number = 20;
  public isLoading: boolean = false;
  public totalPokemons: number = 0;

  constructor(private pokeService: PokeApiService) { }

  ngOnInit() {
    this.loadPokemons();
  }

  loadPokemons() {
    this.isLoading = true;
    this.apiError = false;
    const offset = (this.currentPage - 1) * this.limit;
    this.pokeService.apiListAllPokemons(offset, this.limit).subscribe(res => {
      this.totalPokemons = res.count;
      const pokemonRequests = res.results.map((pokemon) =>
        this.pokeService.apiGetPokemons(pokemon.url).pipe(
          tap(details => (pokemon as any).status = details)
        )
      );
      forkJoin(pokemonRequests).subscribe(() => {
        this.getAllPokemons = res.results.map((pokemon: any) => ({
          name: pokemon.name,
          status: pokemon.status
        }));
        this.isLoading = false;
      }, () => {
        this.apiError = true;
        this.isLoading = false;
      });
    }, () => {
      this.apiError = true;
      this.isLoading = false;
    });
  }

  public getSearch(value: string) {
    if (!value) {
      this.loadPokemons();
      return;
    }
    // Só busca na API se o valor for igual a um nome válido (autocomplete)
    const validNames = (window as any).allPokemonNames || [];
    if (validNames.includes(value.toLowerCase())) {
      this.isLoading = true;
      this.apiError = false;
      this.pokeService.apiGetPokemons(`https://pokeapi.co/api/v2/pokemon/${value.toLowerCase()}`).subscribe(
        details => {
          this.getAllPokemons = [{
            name: details.name,
            status: details
          }];
          this.isLoading = false;
        },
        () => {
          this.getAllPokemons = [];
          this.isLoading = false;
          this.apiError = true;
        }
      );
    } else {
      // Apenas limpa a lista e mostra sugestões, sem buscar na API
      this.getAllPokemons = [];
      this.apiError = false;
      this.isLoading = false;
    }
  }

  public nextPage() {
    if (this.currentPage * this.limit < this.totalPokemons) {
      this.currentPage++;
      this.loadPokemons();
    }
  }

  public prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPokemons();
    }
  }



  public goToPage(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!isNaN(value) && value >= 1 && value <= this.totalPages) {
      this.currentPage = value;
      this.loadPokemons();
    } else {
      input.value = String(this.currentPage);
    }
  }
}
