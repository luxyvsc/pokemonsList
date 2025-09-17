import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'poke-search',
  templateUrl: './poke-search.component.html',
  styleUrls: ['./poke-search.component.scss']
})
export class PokeSearchComponent implements OnInit {
  @Output() public emmitSearch: EventEmitter<string> = new EventEmitter();

  public suggestions: string[] = [];
  public allPokemonNames: string[] = [];
  public searchValue: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>('https://pokeapi.co/api/v2/pokemon?limit=10000').subscribe(res => {
      this.allPokemonNames = res.results.map((p: any) => p.name);
      (window as any).allPokemonNames = this.allPokemonNames;
    });
  }

  public onInput(value: string) {
    this.searchValue = value;
    if (value.length > 0) {
      const val = value.toLowerCase();
      this.suggestions = this.allPokemonNames.filter(name => name.includes(val)).slice(0, 8);
    } else {
      this.suggestions = [];
    }
    this.emmitSearch.emit(value);
  }

  public selectSuggestion(name: string) {
    this.searchValue = name;
    this.suggestions = [];
    this.emmitSearch.emit(name);
  }
}
