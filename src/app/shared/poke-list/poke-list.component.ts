import { Component, OnInit, HostListener } from '@angular/core';
import { PokeApiService } from 'src/app/service/poke-api.service';
import { forkJoin, tap } from 'rxjs';

@Component({
  selector: 'poke-list',
  templateUrl: './poke-list.component.html',
  styleUrls: ['./poke-list.component.scss']
})
export class PokeListComponent implements OnInit {

  private setAllPokemons: any[] = [];
  public getAllPokemons: any[] = [];
  private offset: number = 0;
  private limit: number = 100;
  private isLoading: boolean = false;

  constructor(private pokeService: PokeApiService) { }

  ngOnInit() {
    this.loadMorePokemons();
  }

  loadMorePokemons() {
    if (this.isLoading) return;
    this.isLoading = true;

    this.pokeService.apiListAllPokemons(this.offset, this.limit).subscribe(res => {
      const pokemonRequests = res.results.map((pokemon: any) =>
        this.pokeService.apiGetPokemons(pokemon.url).pipe(
          tap(details => pokemon.status = details)
        )
      );

      forkJoin(pokemonRequests).subscribe(() => {
        this.setAllPokemons.push(...res.results);
        this.getAllPokemons = [...this.setAllPokemons];
        this.offset += this.limit;
        this.isLoading = false;
      });
    }, () => this.isLoading = false);
  }

  public getSearch(value: string) {
    this.getAllPokemons = this.setAllPokemons.filter(res =>
      res.name.toLowerCase().includes(value.toLowerCase())
    );
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      this.loadMorePokemons();
    }
  }
}
